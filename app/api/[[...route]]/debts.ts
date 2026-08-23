import { clerkMiddleware } from "@hono/clerk-auth";
import { zValidator } from "@hono/zod-validator";
import { createId } from "@paralleldrive/cuid2";
import { and, desc, eq, inArray, sum } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import { db } from "@/db/drizzle";
import {
  accounts,
  debtPayments,
  debts,
  insertDebtSchema,
  transactions,
} from "@/db/schema";
import {
  assertAccountOwned,
  duplicateNameConflict,
  isDuplicateNameError,
  requireId,
} from "./_helpers";
import {
  comparePayoffStrategies,
  debtStatus,
  monthsToPayoff,
  monthsUntil,
  outstandingBalance,
  payoffPercentage,
  projectedPayoffDate,
  requiredPayment,
  totalInterest,
} from "@/lib/debts";
import { API_ERRORS } from "@/lib/messages";

import { requireAuth, type AuthedEnv } from "./_middleware";

const MAX_DEBTS = 200;
const MAX_PAYMENTS = 50;

const idParam = z.object({ id: z.string().optional() });

const paymentParam = z.object({
  id: z.string().optional(),
  paymentId: z.string().optional(),
});

const planQuery = z.object({
  extra: z.coerce.number().int().min(0).optional(),
});

const debtBody = insertDebtSchema
  .omit({ id: true, userId: true, createdAt: true, updatedAt: true })
  .extend({
    accountId: z.string().nullable().optional(),
    notes: z.string().trim().nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.targetDate && value.targetDate < value.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["targetDate"],
        message: "The target date cannot be before the start date",
      });
    }
  });

const paymentBody = z.object({
  accountId: z.string().min(1, "Pick the account the money moves through"),
  amount: z
    .number()
    .int()
    .refine((value) => value !== 0, "Enter an amount"),
  date: z.coerce.date(),
  notes: z.string().trim().nullable().optional(),
});

type DebtRow = {
  id: string;
  name: string;
  kind: "loan" | "credit-card" | "other";
  principal: number;
  aprBasisPoints: number;
  minimumPayment: number;
  accountId: string | null;
  account: string | null;
  notes: string | null;
  startDate: Date;
  targetDate: Date | null;
};

async function loadDebts(userId: string, debtId?: string) {
  const filters = [eq(debts.userId, userId)];

  if (debtId) filters.push(eq(debts.id, debtId));

  return db
    .select({
      id: debts.id,
      name: debts.name,
      kind: debts.kind,
      principal: debts.principal,
      aprBasisPoints: debts.aprBasisPoints,
      minimumPayment: debts.minimumPayment,
      accountId: debts.accountId,
      account: accounts.name,
      notes: debts.notes,
      startDate: debts.startDate,
      targetDate: debts.targetDate,
    })
    .from(debts)
    .leftJoin(accounts, eq(debts.accountId, accounts.id))
    .where(and(...filters))
    .orderBy(debts.createdAt)
    .limit(MAX_DEBTS);
}

async function paidByDebt(userId: string, debtIds: string[]) {
  if (debtIds.length === 0) return new Map<string, number>();

  const rows = await db
    .select({
      debtId: debtPayments.debtId,
      paid: sum(debtPayments.amount),
    })
    .from(debtPayments)
    .where(
      and(
        eq(debtPayments.userId, userId),
        inArray(debtPayments.debtId, debtIds)
      )
    )
    .groupBy(debtPayments.debtId);

  return new Map(rows.map((row) => [row.debtId, Number(row.paid ?? 0)]));
}

function paymentForTarget(row: DebtRow, balance: number, now: Date) {
  if (!row.targetDate) return null;

  return requiredPayment(
    balance,
    row.aprBasisPoints,
    monthsUntil(row.targetDate, now)
  );
}

async function withProgress(userId: string, rows: DebtRow[]) {
  const now = new Date();
  const paidTotals = await paidByDebt(
    userId,
    rows.map((row) => row.id)
  );

  return rows.map((row) => {
    const paid = paidTotals.get(row.id) ?? 0;
    const balance = outstandingBalance(row.principal, paid);
    const { aprBasisPoints: apr, minimumPayment } = row;

    return {
      ...row,
      paid,
      balance,
      percentage: payoffPercentage(paid, row.principal),
      status: debtStatus(balance, apr, minimumPayment, row.targetDate, now),
      monthsToPayoff: monthsToPayoff(balance, apr, minimumPayment),
      projectedPayoff: projectedPayoffDate(balance, apr, minimumPayment, now),
      projectedInterest: totalInterest(balance, apr, minimumPayment),
      requiredPayment: paymentForTarget(row, balance, now),
    };
  });
}

async function requireDebt(userId: string, debtId: string) {
  const [owned] = await db
    .select({ id: debts.id, name: debts.name, principal: debts.principal })
    .from(debts)
    .where(and(eq(debts.userId, userId), eq(debts.id, debtId)));

  if (!owned) {
    throw new HTTPException(404, { message: API_ERRORS.notFound });
  }

  return owned;
}

function loadPayments(userId: string, debtId: string) {
  return db
    .select({
      id: debtPayments.id,
      amount: debtPayments.amount,
      notes: debtPayments.notes,
      date: debtPayments.date,
    })
    .from(debtPayments)
    .where(
      and(eq(debtPayments.userId, userId), eq(debtPayments.debtId, debtId))
    )
    .orderBy(desc(debtPayments.date), desc(debtPayments.createdAt))
    .limit(MAX_PAYMENTS);
}

const app = new Hono<AuthedEnv>()
  .use("*", clerkMiddleware(), requireAuth)
  .get("/", async (c) => {
    const userId = c.get("userId");
    const rows = await loadDebts(userId);

    return c.json({ data: await withProgress(userId, rows) });
  })
  .get("/plan", zValidator("query", planQuery), async (c) => {
    const userId = c.get("userId");
    const extra = c.req.valid("query").extra ?? 0;
    const rows = await withProgress(userId, await loadDebts(userId));

    const outstanding = rows
      .filter((row) => row.balance > 0)
      .map((row) => ({
        id: row.id,
        name: row.name,
        balance: row.balance,
        aprBasisPoints: row.aprBasisPoints,
        minimumPayment: row.minimumPayment,
      }));

    return c.json({
      data: {
        extra,
        minimumTotal: outstanding.reduce(
          (total, row) => total + row.minimumPayment,
          0
        ),
        ...comparePayoffStrategies(outstanding, extra),
      },
    });
  })
  .get("/:id", zValidator("param", idParam), async (c) => {
    const userId = c.get("userId");
    const id = requireId(c.req.valid("param").id);
    const rows = await loadDebts(userId, id);

    if (rows.length === 0) {
      throw new HTTPException(404, { message: API_ERRORS.notFound });
    }

    const [debt] = await withProgress(userId, rows);

    if (!debt) {
      throw new HTTPException(404, { message: API_ERRORS.notFound });
    }

    const payments = await loadPayments(userId, id);

    return c.json({ data: { ...debt, payments } });
  })
  .post("/", zValidator("json", debtBody), async (c) => {
    const userId = c.get("userId");
    const values = c.req.valid("json");

    await assertAccountOwned(userId, values.accountId);

    try {
      const [data] = await db
        .insert(debts)
        .values({
          ...values,
          accountId: values.accountId ?? null,
          notes: values.notes ?? null,
          targetDate: values.targetDate ?? null,
          id: createId(),
          userId,
        })
        .returning();

      return c.json({ data });
    } catch (error) {
      if (isDuplicateNameError(error, "debts_user_name_idx")) {
        throw duplicateNameConflict("A debt with that name already exists");
      }
      throw error;
    }
  })
  .patch(
    "/:id",
    zValidator("param", idParam),
    zValidator("json", debtBody),
    async (c) => {
      const userId = c.get("userId");
      const id = requireId(c.req.valid("param").id);
      const values = c.req.valid("json");

      await assertAccountOwned(userId, values.accountId);

      try {
        const [data] = await db
          .update(debts)
          .set({
            ...values,
            accountId: values.accountId ?? null,
            notes: values.notes ?? null,
            targetDate: values.targetDate ?? null,
            updatedAt: new Date(),
          })
          .where(and(eq(debts.userId, userId), eq(debts.id, id)))
          .returning();

        if (!data) {
          throw new HTTPException(404, { message: API_ERRORS.notFound });
        }

        return c.json({ data });
      } catch (error) {
        if (isDuplicateNameError(error, "debts_user_name_idx")) {
          throw duplicateNameConflict("A debt with that name already exists");
        }
        throw error;
      }
    }
  )
  .delete("/:id", zValidator("param", idParam), async (c) => {
    const id = requireId(c.req.valid("param").id);

    const [data] = await db
      .delete(debts)
      .where(and(eq(debts.userId, c.get("userId")), eq(debts.id, id)))
      .returning({ id: debts.id });

    if (!data) {
      throw new HTTPException(404, { message: API_ERRORS.notFound });
    }

    return c.json({ data });
  })
  .get("/:id/payments", zValidator("param", idParam), async (c) => {
    const userId = c.get("userId");
    const debt = await requireDebt(userId, requireId(c.req.valid("param").id));

    return c.json({ data: await loadPayments(userId, debt.id) });
  })
  .post(
    "/:id/payments",
    zValidator("param", idParam),
    zValidator("json", paymentBody),
    async (c) => {
      const userId = c.get("userId");
      const debt = await requireDebt(
        userId,
        requireId(c.req.valid("param").id)
      );
      const values = c.req.valid("json");

      await assertAccountOwned(userId, values.accountId);

      if (values.amount > 0) {
        const paid = (await paidByDebt(userId, [debt.id])).get(debt.id) ?? 0;

        if (paid + values.amount > debt.principal) {
          throw new HTTPException(400, {
            message: "That payment is more than the debt still owes",
          });
        }
      }

      const data = await db.transaction(async (tx) => {
        const [movement] = await tx
          .insert(transactions)
          .values({
            id: createId(),
            amount: -values.amount,
            payee: `Debt: ${debt.name}`,
            notes: values.notes ?? null,
            date: values.date,
            accountId: values.accountId,
            categoryId: null,
          })
          .returning({ id: transactions.id });

        const [payment] = await tx
          .insert(debtPayments)
          .values({
            amount: values.amount,
            date: values.date,
            notes: values.notes ?? null,
            id: createId(),
            debtId: debt.id,
            userId,
            transactionId: movement?.id ?? null,
          })
          .returning();

        return payment;
      });

      return c.json({ data });
    }
  )
  .delete(
    "/:id/payments/:paymentId",
    zValidator("param", paymentParam),
    async (c) => {
      const userId = c.get("userId");
      const { id, paymentId } = c.req.valid("param");
      const debt = await requireDebt(userId, requireId(id));

      const data = await db.transaction(async (tx) => {
        const [removed] = await tx
          .delete(debtPayments)
          .where(
            and(
              eq(debtPayments.userId, userId),
              eq(debtPayments.debtId, debt.id),
              eq(debtPayments.id, requireId(paymentId))
            )
          )
          .returning({
            id: debtPayments.id,
            transactionId: debtPayments.transactionId,
          });

        if (!removed) return null;

        if (removed.transactionId) {
          await tx
            .delete(transactions)
            .where(eq(transactions.id, removed.transactionId));
        }

        return { id: removed.id };
      });

      if (!data) {
        throw new HTTPException(404, { message: API_ERRORS.notFound });
      }

      return c.json({ data });
    }
  );

export default app;
