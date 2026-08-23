import { clerkMiddleware } from "@hono/clerk-auth";
import { zValidator } from "@hono/zod-validator";
import { createId } from "@paralleldrive/cuid2";
import { and, eq, inArray, sql } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import { db } from "@/db/drizzle";
import {
  accounts,
  budgets,
  categories,
  insertBudgetSchema,
  trades,
  transactions,
} from "@/db/schema";
import {
  budgetPercentage,
  budgetStatus,
  isBudgetActiveNow,
  resolveBudgetPeriod,
} from "@/lib/budgets";
import { API_ERRORS } from "@/lib/messages";

import { requireId } from "./_helpers";
import { requireAuth, type AuthedEnv } from "./_middleware";

const MAX_BUDGETS = 200;

const idParam = z.object({ id: z.string().optional() });
const bulkBody = z.object({ ids: z.array(z.string()) });

const budgetBody = insertBudgetSchema
  .omit({ id: true, userId: true, createdAt: true, updatedAt: true })
  .extend({ categoryId: z.string().nullable().optional() })
  .superRefine((value, ctx) => {
    if (value.period === "custom" && !value.endDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "An end date is required for a custom period",
      });
    }
  });

const isUniqueViolation = (error: unknown) =>
  String(error).includes("budgets_user_");

const conflictMessage = (categoryId?: string | null) =>
  categoryId
    ? "A budget already exists for that category and period"
    : "An overall budget already exists for that period";

type BudgetRow = {
  id: string;
  categoryId: string | null;
  category: string | null;
  amount: number;
  period: "weekly" | "monthly" | "yearly" | "custom";
  startDate: Date;
  endDate: Date | null;
};

async function loadBudgets(userId: string, budgetId?: string) {
  const filters = [eq(budgets.userId, userId)];

  if (budgetId) filters.push(eq(budgets.id, budgetId));

  return db
    .select({
      id: budgets.id,
      categoryId: budgets.categoryId,
      category: categories.name,
      amount: budgets.amount,
      period: budgets.period,
      startDate: budgets.startDate,
      endDate: budgets.endDate,
    })
    .from(budgets)
    .leftJoin(categories, eq(budgets.categoryId, categories.id))
    .where(and(...filters))
    .limit(MAX_BUDGETS);
}

async function spentByBudget(
  userId: string,
  windows: (BudgetRow & { periodStart: Date; periodEnd: Date })[]
) {
  if (windows.length === 0) return new Map<string, number>();

  const values = sql.join(
    windows.map(
      (window) =>
        sql`(${window.id}::text, ${window.categoryId}::text, ${window.periodStart}::timestamp, ${window.periodEnd}::timestamp)`
    ),
    sql`, `
  );

  const result = await db.execute<{ budget_id: string; spent: string }>(sql`
    with w (budget_id, category_id, period_start, period_end) as (values ${values}),
         ut as (
           select t.amount, t.date, t.category_id
           from ${transactions} t
           inner join ${accounts} a on a.id = t.account_id
           where a.user_id = ${userId} and t.amount < 0
             and t.transfer_id is null
             and not exists (
               select 1 from ${trades} tr where tr.transaction_id = t.id
             )
         )
    select w.budget_id as budget_id,
           coalesce(sum(abs(ut.amount)), 0)::bigint as spent
    from w
    left join ut
      on ut.date >= w.period_start
     and ut.date <= w.period_end
     and (w.category_id is null or ut.category_id = w.category_id)
    group by w.budget_id
  `);

  return new Map(
    result.rows.map((row) => [String(row.budget_id), Number(row.spent)])
  );
}

async function withProgress(userId: string, rows: BudgetRow[]) {
  const now = new Date();

  const windows = rows.map((row) => ({
    ...row,
    ...resolveBudgetPeriod(row, now),
  }));

  const spent = await spentByBudget(userId, windows);

  return windows.map((window) => {
    const used = spent.get(window.id) ?? 0;
    const percentage = budgetPercentage(used, window.amount);

    return {
      ...window,
      spent: used,
      remaining: window.amount - used,
      percentage,
      status: budgetStatus(percentage),
      isActiveNow: isBudgetActiveNow(window, now),
    };
  });
}

async function assertCategoryOwned(userId: string, categoryId?: string | null) {
  if (!categoryId) return;

  const [owned] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.userId, userId), eq(categories.id, categoryId)));

  if (!owned) {
    throw new HTTPException(400, { message: "Unknown category" });
  }
}

const app = new Hono<AuthedEnv>()
  .use("*", clerkMiddleware(), requireAuth)
  .get("/", async (c) => {
    const rows = await loadBudgets(c.get("userId"));

    return c.json({ data: await withProgress(c.get("userId"), rows) });
  })
  .get("/:id", zValidator("param", idParam), async (c) => {
    const id = requireId(c.req.valid("param").id);
    const rows = await loadBudgets(c.get("userId"), id);

    if (rows.length === 0) {
      throw new HTTPException(404, { message: API_ERRORS.notFound });
    }

    const [data] = await withProgress(c.get("userId"), rows);

    return c.json({ data });
  })
  .post("/", zValidator("json", budgetBody), async (c) => {
    const userId = c.get("userId");
    const values = c.req.valid("json");

    await assertCategoryOwned(userId, values.categoryId);

    try {
      const [data] = await db
        .insert(budgets)
        .values({
          ...values,
          categoryId: values.categoryId ?? null,
          endDate: values.endDate ?? null,
          id: createId(),
          userId,
        })
        .returning();

      return c.json({ data });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new HTTPException(409, {
          message: conflictMessage(values.categoryId),
        });
      }
      throw error;
    }
  })
  .post("/bulk-delete", zValidator("json", bulkBody), async (c) => {
    const data = await db
      .delete(budgets)
      .where(
        and(
          eq(budgets.userId, c.get("userId")),
          inArray(budgets.id, c.req.valid("json").ids)
        )
      )
      .returning({ id: budgets.id });

    return c.json({ data });
  })
  .patch(
    "/:id",
    zValidator("param", idParam),
    zValidator("json", budgetBody),
    async (c) => {
      const id = requireId(c.req.valid("param").id);
      const userId = c.get("userId");
      const values = c.req.valid("json");

      await assertCategoryOwned(userId, values.categoryId);

      try {
        const [data] = await db
          .update(budgets)
          .set({
            ...values,
            categoryId: values.categoryId ?? null,
            endDate: values.endDate ?? null,
            updatedAt: new Date(),
          })
          .where(and(eq(budgets.userId, userId), eq(budgets.id, id)))
          .returning();

        if (!data) {
          throw new HTTPException(404, { message: API_ERRORS.notFound });
        }

        return c.json({ data });
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new HTTPException(409, {
            message: conflictMessage(values.categoryId),
          });
        }
        throw error;
      }
    }
  )
  .delete("/:id", zValidator("param", idParam), async (c) => {
    const id = requireId(c.req.valid("param").id);

    const [data] = await db
      .delete(budgets)
      .where(and(eq(budgets.userId, c.get("userId")), eq(budgets.id, id)))
      .returning({ id: budgets.id });

    if (!data) {
      throw new HTTPException(404, { message: API_ERRORS.notFound });
    }

    return c.json({ data });
  });

export default app;
