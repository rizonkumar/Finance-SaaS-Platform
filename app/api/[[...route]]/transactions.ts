import { z } from "zod";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { createId } from "@paralleldrive/cuid2";
import { zValidator } from "@hono/zod-validator";
import { clerkMiddleware } from "@clerk/hono";
import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";

import { db } from "@/db/drizzle";
import { API_ERRORS } from "@/lib/messages";
import { DAY_PATTERN, DEFAULT_PERIOD_DAYS } from "@/lib/constants";
import { addDaysUTC, dateKeyUTC, parseDayUTC } from "@/lib/date-utc";
import { findDuplicateIndexes } from "@/lib/duplicates";
import { safeMaterialize } from "@/lib/recurring";
import {
  transactions,
  transactionInputSchema,
  insertTransactionSchema,
  transactionSplits,
  categories,
  accounts,
  trades,
} from "@/db/schema";

import {
  assertAccountOwned,
  assertCategoriesOwned,
  bulkBody,
  idParam,
  periodQuery,
  requireId,
  requireRow,
  resolvePeriod,
} from "./_helpers";
import { requireAuth, type AuthedEnv } from "./_middleware";
import { categorizeRows } from "./_rules";
import { assertValidSplits, loadSplits, splitRows } from "./_splits";

const TRANSFER_LEG_ERROR =
  "This is one leg of a transfer. Edit it from the transfer sheet instead.";

const TRADE_BACKED_ERROR =
  "This is the cash side of a trade. Change it from the Portfolio page instead.";

const MAX_DUPLICATE_ROWS = 5000;

const importBody = z.array(
  insertTransactionSchema.omit({
    id: true,
    recurringId: true,
    transferId: true,
  })
);

const duplicatesBody = z.object({
  accountId: z.string().min(1),
  rows: z
    .array(
      z.object({
        date: z.string().regex(DAY_PATTERN),
        amount: z.number().int(),
        payee: z.string(),
      })
    )
    .max(MAX_DUPLICATE_ROWS),
});

type TransactionInput = z.infer<typeof transactionInputSchema>;

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

async function findOwned(userId: string, id: string) {
  const [row] = await db
    .select({ transferId: transactions.transferId })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(and(eq(transactions.id, id), eq(accounts.userId, userId)));

  return requireRow(row);
}

async function prepareInput(
  userId: string,
  input: TransactionInput,
  { applyRules }: { applyRules: boolean }
) {
  const { splits, ...values } = input;

  await assertAccountOwned(userId, values.accountId);
  await assertCategoriesOwned(userId, [values.categoryId]);
  await assertValidSplits(userId, values.amount, splits);

  if (splits && splits.length > 0) {
    return { values: { ...values, categoryId: null }, splits };
  }

  if (!applyRules) return { values, splits };

  const [categorized = values] = await categorizeRows(userId, [values]);

  return { values: categorized, splits };
}

const app = new Hono<AuthedEnv>()
  .use("*", clerkMiddleware(), requireAuth)
  .get("/", zValidator("query", periodQuery), async (c) => {
    const userId = c.get("userId");
    const { accountId, ...period } = c.req.valid("query");

    await safeMaterialize(userId);

    const { startDate, endDate } = resolvePeriod(period, DEFAULT_PERIOD_DAYS);

    const rows = await db
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
          eq(accounts.userId, userId),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      )
      .orderBy(desc(transactions.date));

    const splits = await loadSplits(rows.map((row) => row.id));

    const data = rows.map((row) => ({
      ...row,
      splits: splits.get(row.id) ?? [],
    }));

    return c.json({ data });
  })
  .get("/:id", zValidator("param", idParam), async (c) => {
    const id = requireId(c.req.valid("param").id);

    const [row] = await db
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
      .where(
        and(eq(transactions.id, id), eq(accounts.userId, c.get("userId")))
      );

    const splits = await loadSplits([id]);

    return c.json({
      data: { ...requireRow(row), splits: splits.get(id) ?? [] },
    });
  })
  .post("/", zValidator("json", transactionInputSchema), async (c) => {
    const id = createId();
    const { values, splits } = await prepareInput(
      c.get("userId"),
      c.req.valid("json"),
      { applyRules: true }
    );

    const [[data]] = await db.batch([
      db
        .insert(transactions)
        .values({ id, ...values })
        .returning(),
      ...(splits && splits.length > 0
        ? [db.insert(transactionSplits).values(splitRows(id, splits))]
        : []),
    ]);

    return c.json({ data });
  })
  .post("/bulk-create", zValidator("json", importBody), async (c) => {
    const userId = c.get("userId");
    const values = c.req.valid("json");

    if (values.length === 0) return c.json({ data: [] });

    await Promise.all(
      [...new Set(values.map((value) => value.accountId))].map((accountId) =>
        assertAccountOwned(userId, accountId)
      )
    );
    await assertCategoriesOwned(
      userId,
      values.map((value) => value.categoryId)
    );

    const categorized = await categorizeRows(userId, values);

    const data = await db
      .insert(transactions)
      .values(categorized.map((value) => ({ id: createId(), ...value })))
      .returning();

    return c.json({ data });
  })
  .post("/duplicates", zValidator("json", duplicatesBody), async (c) => {
    const userId = c.get("userId");
    const { accountId, rows } = c.req.valid("json");

    await assertAccountOwned(userId, accountId);

    if (rows.length === 0) return c.json({ data: [] });

    const days = rows.map((row) => row.date).sort((a, b) => a.localeCompare(b));
    const first = addDaysUTC(parseDayUTC(days[0] ?? ""), -1);
    const last = addDaysUTC(parseDayUTC(days.at(-1) ?? ""), 1);

    const existing = await db
      .select({
        date: transactions.date,
        amount: transactions.amount,
        payee: transactions.payee,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.accountId, accountId),
          gte(transactions.date, first),
          lte(transactions.date, last)
        )
      );

    const data = findDuplicateIndexes(
      rows,
      existing.map((row) => ({ ...row, date: dateKeyUTC(row.date) }))
    );

    return c.json({ data });
  })
  .post("/bulk-delete", zValidator("json", bulkBody), async (c) => {
    const userId = c.get("userId");
    const ids = await withTransferSiblings(userId, c.req.valid("json").ids);

    if (ids.length === 0) return c.json({ data: [] });

    await assertNoTradeBacked(userId, ids);

    const data = await db
      .delete(transactions)
      .where(inArray(transactions.id, ids))
      .returning({ id: transactions.id });

    return c.json({ data });
  })
  .patch(
    "/:id",
    zValidator("param", idParam),
    zValidator("json", transactionInputSchema),
    async (c) => {
      const userId = c.get("userId");
      const id = requireId(c.req.valid("param").id);
      const existing = await findOwned(userId, id);

      if (existing.transferId) {
        throw new HTTPException(400, { message: TRANSFER_LEG_ERROR });
      }

      await assertNoTradeBacked(userId, [id]);

      const { values, splits } = await prepareInput(
        userId,
        c.req.valid("json"),
        { applyRules: false }
      );

      const update = db
        .update(transactions)
        .set(values)
        .where(eq(transactions.id, id))
        .returning();

      if (!splits) {
        const [data] = await update;

        return c.json({ data: requireRow(data) });
      }

      const [[data]] = await db.batch([
        update,
        db
          .delete(transactionSplits)
          .where(eq(transactionSplits.transactionId, id)),
        ...(splits.length > 0
          ? [db.insert(transactionSplits).values(splitRows(id, splits))]
          : []),
      ]);

      return c.json({ data: requireRow(data) });
    }
  )
  .delete("/:id", zValidator("param", idParam), async (c) => {
    const userId = c.get("userId");
    const id = requireId(c.req.valid("param").id);
    const ids = await withTransferSiblings(userId, [id]);

    if (ids.length === 0) {
      throw new HTTPException(404, { message: API_ERRORS.notFound });
    }

    await assertNoTradeBacked(userId, ids);

    await db.delete(transactions).where(inArray(transactions.id, ids));

    return c.json({ data: { id } });
  });

export default app;
