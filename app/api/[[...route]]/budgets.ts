import { clerkMiddleware } from "@clerk/hono";
import { zValidator } from "@hono/zod-validator";
import { createId } from "@paralleldrive/cuid2";
import { and, eq, gte, inArray, lt, lte } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import { db } from "@/db/drizzle";
import { budgets, categories, insertBudgetSchema } from "@/db/schema";
import {
  budgetPercentage,
  budgetStatus,
  isBudgetActiveNow,
  resolveBudgetPeriod,
  spentInWindow,
  type BudgetWindow,
  type DailySpend,
} from "@/lib/budgets";
import { API_ERRORS } from "@/lib/messages";

import { assertCategoriesOwned, loadSettings, requireId } from "./_helpers";
import { expensesOf, spendingLines } from "./_ledger";
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

async function dailySpend(
  userId: string,
  windows: BudgetWindow[]
): Promise<DailySpend[]> {
  if (windows.length === 0) return [];

  const from = new Date(
    Math.min(...windows.map((window) => window.periodStart.getTime()))
  );
  const to = new Date(
    Math.max(...windows.map((window) => window.periodEnd.getTime()))
  );
  const lines = spendingLines(userId);

  return db
    .select({
      date: lines.date,
      categoryId: lines.categoryId,
      spent: expensesOf(lines),
    })
    .from(lines)
    .where(and(lt(lines.amount, 0), gte(lines.date, from), lte(lines.date, to)))
    .groupBy(lines.date, lines.categoryId);
}

async function withProgress(userId: string, rows: BudgetRow[]) {
  const now = new Date();
  const { weekStartsOn } = await loadSettings(userId);

  const windows = rows.map((row) => ({
    ...row,
    ...resolveBudgetPeriod(row, now, weekStartsOn),
  }));

  const daily = await dailySpend(userId, windows);

  return windows.map((window) => {
    const used = spentInWindow(window, daily);
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

    await assertCategoriesOwned(userId, [values.categoryId]);

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

      await assertCategoriesOwned(userId, [values.categoryId]);

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
