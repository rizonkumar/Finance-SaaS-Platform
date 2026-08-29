import { createId } from "@paralleldrive/cuid2";
import { zValidator } from "@hono/zod-validator";
import { clerkMiddleware } from "@clerk/hono";
import { and, eq, sql } from "drizzle-orm";
import { Hono } from "hono";

import { db } from "@/db/drizzle";
import {
  budgets,
  categories,
  insertCategorySchema,
  transactions,
} from "@/db/schema";

import {
  bulkBody,
  deleteOwnedRow,
  deleteOwnedRows,
  idParam,
  requireId,
  requireRow,
} from "./_helpers";
import { requireAuth, type AuthedEnv } from "./_middleware";

const categoryBody = insertCategorySchema.pick({
  name: true,
});

const writeColumns = {
  id: categories.id,
  name: categories.name,
};

async function selectCategories(userId: string, id?: string) {
  const baseCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      transactionCount: sql<number>`COALESCE(COUNT(DISTINCT ${transactions.id}), 0)::int`,
      totalExpenses: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.amount} < 0 THEN ABS(${transactions.amount}) ELSE 0 END), 0)::int`,
      totalIncome: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.amount} > 0 THEN ${transactions.amount} ELSE 0 END), 0)::int`,
    })
    .from(categories)
    .leftJoin(transactions, eq(transactions.categoryId, categories.id))
    .where(
      and(eq(categories.userId, userId), id ? eq(categories.id, id) : undefined)
    )
    .groupBy(categories.id)
    .orderBy(categories.name);

  const userBudgets = await db
    .select({
      categoryId: budgets.categoryId,
      amount: budgets.amount,
    })
    .from(budgets)
    .where(eq(budgets.userId, userId));

  const budgetMap = new Map<string, number>();
  for (const b of userBudgets) {
    if (b.categoryId) {
      budgetMap.set(b.categoryId, b.amount);
    }
  }

  return baseCategories.map((cat) => ({
    ...cat,
    budgetAmount: budgetMap.get(cat.id) ?? null,
  }));
}

const app = new Hono<AuthedEnv>()
  .use("*", clerkMiddleware(), requireAuth)
  .get("/", async (c) => {
    const data = await selectCategories(c.get("userId"));

    return c.json({ data });
  })
  .get("/:id", zValidator("param", idParam), async (c) => {
    const id = requireId(c.req.valid("param").id);
    const [row] = await selectCategories(c.get("userId"), id);

    return c.json({ data: requireRow(row) });
  })
  .post("/", zValidator("json", categoryBody), async (c) => {
    const [data] = await db
      .insert(categories)
      .values({
        id: createId(),
        userId: c.get("userId"),
        ...c.req.valid("json"),
      })
      .returning(writeColumns);

    return c.json({ data });
  })
  .post("/bulk-delete", zValidator("json", bulkBody), async (c) => {
    const data = await deleteOwnedRows(
      categories,
      c.get("userId"),
      c.req.valid("json").ids
    );

    return c.json({ data });
  })
  .patch(
    "/:id",
    zValidator("param", idParam),
    zValidator("json", categoryBody),
    async (c) => {
      const id = requireId(c.req.valid("param").id);

      const [row] = await db
        .update(categories)
        .set(c.req.valid("json"))
        .where(
          and(eq(categories.userId, c.get("userId")), eq(categories.id, id))
        )
        .returning(writeColumns);

      return c.json({ data: requireRow(row) });
    }
  )
  .delete("/:id", zValidator("param", idParam), async (c) => {
    const [row] = await deleteOwnedRow(
      categories,
      c.get("userId"),
      requireId(c.req.valid("param").id)
    );

    return c.json({ data: requireRow(row) });
  });

export default app;
