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
  goalContributions,
  goals,
  insertGoalSchema,
} from "@/db/schema";
import {
  averagePerMonth,
  daysRemaining,
  expectedPercentage,
  goalPercentage,
  goalStatus,
  projectedCompletion,
  requiredPerMonth,
} from "@/lib/goals";
import { API_ERRORS } from "@/lib/messages";

import { requireAuth, type AuthedEnv } from "./_middleware";

const MAX_GOALS = 200;
const MAX_CONTRIBUTIONS = 50;

const idParam = z.object({ id: z.string().optional() });

const contributionParam = z.object({
  id: z.string().optional(),
  contributionId: z.string().optional(),
});

const goalBody = insertGoalSchema
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

const contributionBody = z.object({
  amount: z
    .number()
    .int()
    .refine((value) => value !== 0, "Enter an amount"),
  date: z.coerce.date(),
  notes: z.string().trim().nullable().optional(),
});

const requireId = (id?: string) => {
  if (!id) throw new HTTPException(400, { message: API_ERRORS.missingId });
  return id;
};

const isDuplicateName = (error: unknown) =>
  String(error).includes("goals_user_name_idx");

const duplicateNameError = () =>
  new HTTPException(409, { message: "A goal with that name already exists" });

type GoalRow = {
  id: string;
  name: string;
  targetAmount: number;
  accountId: string | null;
  account: string | null;
  notes: string | null;
  startDate: Date;
  targetDate: Date | null;
};

async function loadGoals(userId: string, goalId?: string) {
  const filters = [eq(goals.userId, userId)];

  if (goalId) filters.push(eq(goals.id, goalId));

  return db
    .select({
      id: goals.id,
      name: goals.name,
      targetAmount: goals.targetAmount,
      accountId: goals.accountId,
      account: accounts.name,
      notes: goals.notes,
      startDate: goals.startDate,
      targetDate: goals.targetDate,
    })
    .from(goals)
    .leftJoin(accounts, eq(goals.accountId, accounts.id))
    .where(and(...filters))
    .orderBy(goals.createdAt)
    .limit(MAX_GOALS);
}

async function savedByGoal(userId: string, goalIds: string[]) {
  if (goalIds.length === 0) return new Map<string, number>();

  const rows = await db
    .select({
      goalId: goalContributions.goalId,
      saved: sum(goalContributions.amount),
    })
    .from(goalContributions)
    .where(
      and(
        eq(goalContributions.userId, userId),
        inArray(goalContributions.goalId, goalIds)
      )
    )
    .groupBy(goalContributions.goalId);

  return new Map(rows.map((row) => [row.goalId, Number(row.saved ?? 0)]));
}

async function withProgress(userId: string, rows: GoalRow[]) {
  const now = new Date();
  const saved = await savedByGoal(
    userId,
    rows.map((row) => row.id)
  );

  return rows.map((row) => {
    const timeline = { startDate: row.startDate, targetDate: row.targetDate };
    const funded = saved.get(row.id) ?? 0;

    return {
      ...row,
      saved: funded,
      remaining: Math.max(row.targetAmount - funded, 0),
      percentage: goalPercentage(funded, row.targetAmount),
      expectedPercentage: expectedPercentage(timeline, now),
      status: goalStatus(funded, row.targetAmount, timeline, now),
      daysRemaining: daysRemaining(timeline, now),
      requiredPerMonth: requiredPerMonth(
        funded,
        row.targetAmount,
        timeline,
        now
      ),
      averagePerMonth: averagePerMonth(funded, timeline, now),
      projectedCompletion: projectedCompletion(
        funded,
        row.targetAmount,
        timeline,
        now
      ),
    };
  });
}

async function assertAccountOwned(userId: string, accountId?: string | null) {
  if (!accountId) return;

  const [owned] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.id, accountId)));

  if (!owned) {
    throw new HTTPException(400, { message: "Unknown account" });
  }
}

async function requireGoal(userId: string, goalId: string) {
  const [owned] = await db
    .select({ id: goals.id })
    .from(goals)
    .where(and(eq(goals.userId, userId), eq(goals.id, goalId)));

  if (!owned) {
    throw new HTTPException(404, { message: API_ERRORS.notFound });
  }

  return owned.id;
}

function loadContributions(userId: string, goalId: string) {
  return db
    .select({
      id: goalContributions.id,
      amount: goalContributions.amount,
      notes: goalContributions.notes,
      date: goalContributions.date,
    })
    .from(goalContributions)
    .where(
      and(
        eq(goalContributions.userId, userId),
        eq(goalContributions.goalId, goalId)
      )
    )
    .orderBy(desc(goalContributions.date), desc(goalContributions.createdAt))
    .limit(MAX_CONTRIBUTIONS);
}

const app = new Hono<AuthedEnv>()
  .use("*", clerkMiddleware(), requireAuth)
  .get("/", async (c) => {
    const userId = c.get("userId");
    const rows = await loadGoals(userId);

    return c.json({ data: await withProgress(userId, rows) });
  })
  .get("/:id", zValidator("param", idParam), async (c) => {
    const userId = c.get("userId");
    const id = requireId(c.req.valid("param").id);
    const rows = await loadGoals(userId, id);

    if (rows.length === 0) {
      throw new HTTPException(404, { message: API_ERRORS.notFound });
    }

    const [goal] = await withProgress(userId, rows);

    if (!goal) {
      throw new HTTPException(404, { message: API_ERRORS.notFound });
    }

    const contributions = await loadContributions(userId, id);

    return c.json({ data: { ...goal, contributions } });
  })
  .post("/", zValidator("json", goalBody), async (c) => {
    const userId = c.get("userId");
    const values = c.req.valid("json");

    await assertAccountOwned(userId, values.accountId);

    try {
      const [data] = await db
        .insert(goals)
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
      if (isDuplicateName(error)) throw duplicateNameError();
      throw error;
    }
  })
  .patch(
    "/:id",
    zValidator("param", idParam),
    zValidator("json", goalBody),
    async (c) => {
      const userId = c.get("userId");
      const id = requireId(c.req.valid("param").id);
      const values = c.req.valid("json");

      await assertAccountOwned(userId, values.accountId);

      try {
        const [data] = await db
          .update(goals)
          .set({
            ...values,
            accountId: values.accountId ?? null,
            notes: values.notes ?? null,
            targetDate: values.targetDate ?? null,
            updatedAt: new Date(),
          })
          .where(and(eq(goals.userId, userId), eq(goals.id, id)))
          .returning();

        if (!data) {
          throw new HTTPException(404, { message: API_ERRORS.notFound });
        }

        return c.json({ data });
      } catch (error) {
        if (isDuplicateName(error)) throw duplicateNameError();
        throw error;
      }
    }
  )
  .delete("/:id", zValidator("param", idParam), async (c) => {
    const id = requireId(c.req.valid("param").id);

    const [data] = await db
      .delete(goals)
      .where(and(eq(goals.userId, c.get("userId")), eq(goals.id, id)))
      .returning({ id: goals.id });

    if (!data) {
      throw new HTTPException(404, { message: API_ERRORS.notFound });
    }

    return c.json({ data });
  })
  .get("/:id/contributions", zValidator("param", idParam), async (c) => {
    const userId = c.get("userId");
    const id = await requireGoal(userId, requireId(c.req.valid("param").id));

    return c.json({ data: await loadContributions(userId, id) });
  })
  .post(
    "/:id/contributions",
    zValidator("param", idParam),
    zValidator("json", contributionBody),
    async (c) => {
      const userId = c.get("userId");
      const id = await requireGoal(userId, requireId(c.req.valid("param").id));
      const values = c.req.valid("json");

      // A withdrawal is allowed, but it cannot take the goal below zero.
      if (values.amount < 0) {
        const saved = (await savedByGoal(userId, [id])).get(id) ?? 0;

        if (saved + values.amount < 0) {
          throw new HTTPException(400, {
            message: "That withdrawal is more than the goal holds",
          });
        }
      }

      const [data] = await db
        .insert(goalContributions)
        .values({
          ...values,
          notes: values.notes ?? null,
          id: createId(),
          goalId: id,
          userId,
        })
        .returning();

      return c.json({ data });
    }
  )
  .delete(
    "/:id/contributions/:contributionId",
    zValidator("param", contributionParam),
    async (c) => {
      const userId = c.get("userId");
      const { id, contributionId } = c.req.valid("param");
      const goalId = await requireGoal(userId, requireId(id));

      const [data] = await db
        .delete(goalContributions)
        .where(
          and(
            eq(goalContributions.userId, userId),
            eq(goalContributions.goalId, goalId),
            eq(goalContributions.id, requireId(contributionId))
          )
        )
        .returning({ id: goalContributions.id });

      if (!data) {
        throw new HTTPException(404, { message: API_ERRORS.notFound });
      }

      return c.json({ data });
    }
  );

export default app;
