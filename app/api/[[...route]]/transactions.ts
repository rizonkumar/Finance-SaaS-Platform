import { z } from "zod";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { parse, subDays } from "date-fns";
import { createId } from "@paralleldrive/cuid2";
import { zValidator } from "@hono/zod-validator";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";

import { db } from "@/db/drizzle";
import { API_ERRORS } from "@/lib/messages";
import { DATE_FORMAT, DEFAULT_PERIOD_DAYS } from "@/lib/constants";
import { materializeRecurringTransactions } from "@/lib/recurring";
import {
  transactions,
  insertTransactionSchema,
  categories,
  accounts,
  trades,
} from "@/db/schema";

const TRANSFER_LEG_ERROR =
  "This is one leg of a transfer. Edit it from the transfer sheet instead.";

const TRADE_BACKED_ERROR =
  "This is the cash side of a trade. Change it from the Portfolio page instead.";

async function assertNoTradeBacked(userId: string, ids: string[]) {
  if (ids.length === 0) return;

  const [backed] = await db
    .select({ id: trades.id })
    .from(trades)
    .where(and(eq(trades.userId, userId), inArray(trades.transactionId, ids)))
    .limit(1);

  if (backed) {
    throw new HTTPException(400, { message: TRADE_BACKED_ERROR });
  }
}

async function withTransferSiblings(userId: string, ids: string[]) {
  if (ids.length === 0) return [];

  const owned = await db
    .select({ id: transactions.id, transferId: transactions.transferId })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(and(inArray(transactions.id, ids), eq(accounts.userId, userId)));

  const transferIds = owned
    .map((row) => row.transferId)
    .filter((value): value is string => value !== null);

  if (transferIds.length === 0) return owned.map((row) => row.id);

  const legs = await db
    .select({ id: transactions.id })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(
      and(
        inArray(transactions.transferId, transferIds),
        eq(accounts.userId, userId)
      )
    );

  return [
    ...new Set([...owned.map((row) => row.id), ...legs.map((row) => row.id)]),
  ];
}

const app = new Hono()
  .get(
    "/",
    zValidator(
      "query",
      z.object({
        from: z.string().optional(),
        to: z.string().optional(),
        accountId: z.string().optional(),
      })
    ),
    clerkMiddleware(),
    async (c) => {
      const auth = getAuth(c);
      const { from, to, accountId } = c.req.valid("query");

      if (!auth?.userId) {
        return c.json({ error: API_ERRORS.unauthorized }, 401);
      }

      try {
        await materializeRecurringTransactions(auth.userId);
      } catch (error) {
        console.error("[recurring] materialize failed", error);
      }

      const defaultTo = new Date();
      const defaultFrom = subDays(defaultTo, DEFAULT_PERIOD_DAYS);

      const startDate = from
        ? parse(from, DATE_FORMAT, new Date())
        : defaultFrom;
      const endDate = to ? parse(to, DATE_FORMAT, new Date()) : defaultTo;

      const data = await db
        .select({
          id: transactions.id,
          date: transactions.date,
          category: categories.name,
          categoryId: transactions.categoryId,
          payee: transactions.payee,
          amount: transactions.amount,
          notes: transactions.notes,
          account: accounts.name,
          accountId: transactions.accountId,
          recurringId: transactions.recurringId,
          transferId: transactions.transferId,
        })
        .from(transactions)
        .innerJoin(accounts, eq(transactions.accountId, accounts.id))
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .where(
          and(
            accountId ? eq(transactions.accountId, accountId) : undefined,
            eq(accounts.userId, auth.userId),
            gte(transactions.date, startDate),
            lte(transactions.date, endDate)
          )
        )
        .orderBy(desc(transactions.date));

      return c.json({ data });
    }
  )
  .get(
    "/:id",
    zValidator(
      "param",
      z.object({
        id: z.string().optional(),
      })
    ),
    clerkMiddleware(),
    async (c) => {
      const auth = getAuth(c);
      const { id } = c.req.valid("param");

      if (!id) {
        return c.json({ error: API_ERRORS.missingId }, 400);
      }

      if (!auth?.userId) {
        return c.json({ error: API_ERRORS.unauthorized }, 401);
      }

      const [data] = await db
        .select({
          id: transactions.id,
          date: transactions.date,
          categoryId: transactions.categoryId,
          payee: transactions.payee,
          amount: transactions.amount,
          notes: transactions.notes,
          accountId: transactions.accountId,
          transferId: transactions.transferId,
        })
        .from(transactions)
        .innerJoin(accounts, eq(transactions.accountId, accounts.id))
        .where(and(eq(transactions.id, id), eq(accounts.userId, auth.userId)));

      if (!data) {
        return c.json({ error: API_ERRORS.notFound }, 404);
      }

      return c.json({ data });
    }
  )
  .post(
    "/",
    clerkMiddleware(),
    zValidator(
      "json",
      insertTransactionSchema.omit({
        id: true,
        recurringId: true,
        transferId: true,
      })
    ),
    async (c) => {
      const auth = getAuth(c);
      const values = c.req.valid("json");

      if (!auth?.userId) {
        return c.json({ error: API_ERRORS.unauthorized }, 401);
      }

      const [data] = await db
        .insert(transactions)
        .values({
          id: createId(),
          ...values,
        })
        .returning();

      return c.json({ data });
    }
  )
  .post(
    "/bulk-create",
    clerkMiddleware(),
    zValidator(
      "json",
      z.array(
        insertTransactionSchema.omit({
          id: true,
          recurringId: true,
          transferId: true,
        })
      )
    ),
    async (c) => {
      const auth = getAuth(c);
      const values = c.req.valid("json");

      if (!auth?.userId) {
        return c.json({ error: API_ERRORS.unauthorized }, 401);
      }

      const data = await db
        .insert(transactions)
        .values(
          values.map((value) => ({
            id: createId(),
            ...value,
          }))
        )
        .returning();

      return c.json({ data });
    }
  )
  .post(
    "/bulk-delete",
    clerkMiddleware(),
    zValidator(
      "json",
      z.object({
        ids: z.array(z.string()),
      })
    ),
    async (c) => {
      const auth = getAuth(c);
      const values = c.req.valid("json");

      if (!auth?.userId) {
        return c.json({ error: API_ERRORS.unauthorized }, 401);
      }

      const ids = await withTransferSiblings(auth.userId, values.ids);

      if (ids.length === 0) {
        return c.json({ data: [] });
      }

      await assertNoTradeBacked(auth.userId, ids);

      const data = await db
        .delete(transactions)
        .where(inArray(transactions.id, ids))
        .returning({
          id: transactions.id,
        });

      return c.json({ data });
    }
  )
  .patch(
    "/:id",
    clerkMiddleware(),
    zValidator(
      "param",
      z.object({
        id: z.string().optional(),
      })
    ),
    zValidator(
      "json",
      insertTransactionSchema.omit({
        id: true,
        recurringId: true,
        transferId: true,
      })
    ),
    async (c) => {
      const auth = getAuth(c);
      const { id } = c.req.valid("param");
      const values = c.req.valid("json");

      if (!id) {
        return c.json({ error: API_ERRORS.missingId }, 400);
      }

      if (!auth?.userId) {
        return c.json({ error: API_ERRORS.unauthorized }, 401);
      }

      const [existing] = await db
        .select({ transferId: transactions.transferId })
        .from(transactions)
        .innerJoin(accounts, eq(transactions.accountId, accounts.id))
        .where(and(eq(transactions.id, id), eq(accounts.userId, auth.userId)));

      if (!existing) {
        return c.json({ error: API_ERRORS.notFound }, 404);
      }

      if (existing.transferId) {
        return c.json({ error: TRANSFER_LEG_ERROR }, 400);
      }

      await assertNoTradeBacked(auth.userId, [id]);

      const transactionsToUpdate = db.$with("transactions_to_update").as(
        db
          .select({ id: transactions.id })
          .from(transactions)
          .innerJoin(accounts, eq(transactions.accountId, accounts.id))
          .where(and(eq(transactions.id, id), eq(accounts.userId, auth.userId)))
      );

      const [data] = await db
        .with(transactionsToUpdate)
        .update(transactions)
        .set(values)
        .where(
          inArray(
            transactions.id,
            sql`(select id from ${transactionsToUpdate})`
          )
        )
        .returning();

      if (!data) {
        return c.json({ error: API_ERRORS.notFound }, 404);
      }

      return c.json({ data });
    }
  )
  .delete(
    "/:id",
    clerkMiddleware(),
    zValidator(
      "param",
      z.object({
        id: z.string().optional(),
      })
    ),
    async (c) => {
      const auth = getAuth(c);
      const { id } = c.req.valid("param");

      if (!id) {
        return c.json({ error: API_ERRORS.missingId }, 400);
      }

      if (!auth?.userId) {
        return c.json({ error: API_ERRORS.unauthorized }, 401);
      }

      const ids = await withTransferSiblings(auth.userId, [id]);

      if (ids.length === 0) {
        return c.json({ error: API_ERRORS.notFound }, 404);
      }

      await assertNoTradeBacked(auth.userId, ids);

      await db.delete(transactions).where(inArray(transactions.id, ids));

      return c.json({ data: { id } });
    }
  );

export default app;
