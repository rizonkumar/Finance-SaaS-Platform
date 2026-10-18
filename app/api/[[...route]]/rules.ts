import { clerkMiddleware } from "@clerk/hono";
import { zValidator } from "@hono/zod-validator";
import { createId } from "@paralleldrive/cuid2";
import { and, desc, eq, inArray, isNull, notExists, sql } from "drizzle-orm";
import { Hono } from "hono";

import { db } from "@/db/drizzle";
import {
  accounts,
  categories,
  categoryRules,
  insertCategoryRuleSchema,
  transactionSplits,
  transactions,
} from "@/db/schema";
import { matchesRule } from "@/lib/category-rules";

import {
  assertCategoriesOwned,
  bulkBody,
  deleteOwnedRow,
  deleteOwnedRows,
  idParam,
  requireId,
  requireRow,
} from "./_helpers";
import { NOT_A_TRADE, NOT_A_TRANSFER } from "./_ledger";
import { requireAuth, type AuthedEnv } from "./_middleware";

const ruleBody = insertCategoryRuleSchema.pick({
  pattern: true,
  match: true,
  categoryId: true,
  priority: true,
});

const ruleColumns = {
  id: categoryRules.id,
  pattern: categoryRules.pattern,
  match: categoryRules.match,
  categoryId: categoryRules.categoryId,
  priority: categoryRules.priority,
};

function selectRules(userId: string, id?: string) {
  return db
    .select({ ...ruleColumns, category: categories.name })
    .from(categoryRules)
    .innerJoin(categories, eq(categoryRules.categoryId, categories.id))
    .where(
      and(
        eq(categoryRules.userId, userId),
        id ? eq(categoryRules.id, id) : undefined
      )
    )
    .orderBy(desc(categoryRules.priority), categoryRules.createdAt);
}

const NOT_SPLIT = notExists(
  db
    .select({ one: sql`1` })
    .from(transactionSplits)
    .where(eq(transactionSplits.transactionId, transactions.id))
);

function uncategorizedTransactions(userId: string) {
  return db
    .select({ id: transactions.id, payee: transactions.payee })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(
      and(
        eq(accounts.userId, userId),
        isNull(transactions.categoryId),
        NOT_A_TRANSFER,
        NOT_A_TRADE,
        NOT_SPLIT
      )
    );
}

const app = new Hono<AuthedEnv>()
  .use("*", clerkMiddleware(), requireAuth)
  .get("/", async (c) => {
    const data = await selectRules(c.get("userId"));

    return c.json({ data });
  })
  .get("/:id", zValidator("param", idParam), async (c) => {
    const id = requireId(c.req.valid("param").id);
    const [row] = await selectRules(c.get("userId"), id);

    return c.json({ data: requireRow(row) });
  })
  .post("/", zValidator("json", ruleBody), async (c) => {
    const userId = c.get("userId");
    const values = c.req.valid("json");

    await assertCategoriesOwned(userId, [values.categoryId]);

    const [data] = await db
      .insert(categoryRules)
      .values({ id: createId(), userId, ...values })
      .returning(ruleColumns);

    return c.json({ data });
  })
  .post("/bulk-delete", zValidator("json", bulkBody), async (c) => {
    const data = await deleteOwnedRows(
      categoryRules,
      c.get("userId"),
      c.req.valid("json").ids
    );

    return c.json({ data });
  })
  .post("/:id/apply", zValidator("param", idParam), async (c) => {
    const userId = c.get("userId");
    const id = requireId(c.req.valid("param").id);
    const [rule] = await selectRules(userId, id);
    const { pattern, match, categoryId } = requireRow(rule);

    const candidates = await uncategorizedTransactions(userId);
    const ids = candidates
      .filter((row) => matchesRule(row.payee, { pattern, match }))
      .map((row) => row.id);

    if (ids.length > 0) {
      await db
        .update(transactions)
        .set({ categoryId })
        .where(inArray(transactions.id, ids));
    }

    return c.json({ data: { count: ids.length } });
  })
  .patch(
    "/:id",
    zValidator("param", idParam),
    zValidator("json", ruleBody),
    async (c) => {
      const userId = c.get("userId");
      const id = requireId(c.req.valid("param").id);
      const values = c.req.valid("json");

      await assertCategoriesOwned(userId, [values.categoryId]);

      const [row] = await db
        .update(categoryRules)
        .set(values)
        .where(and(eq(categoryRules.userId, userId), eq(categoryRules.id, id)))
        .returning(ruleColumns);

      return c.json({ data: requireRow(row) });
    }
  )
  .delete("/:id", zValidator("param", idParam), async (c) => {
    const [row] = await deleteOwnedRow(
      categoryRules,
      c.get("userId"),
      requireId(c.req.valid("param").id)
    );

    return c.json({ data: requireRow(row) });
  });

export default app;
