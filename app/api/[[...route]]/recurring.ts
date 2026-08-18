import { clerkMiddleware } from "@hono/clerk-auth";
import { zValidator } from "@hono/zod-validator";
import { createId } from "@paralleldrive/cuid2";
import { and, count, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import { db } from "@/db/drizzle";
import {
  accounts,
  categories,
  insertRecurringTransactionSchema,
  recurringTransactions,
  transactions,
} from "@/db/schema";
import { API_ERRORS } from "@/lib/messages";
import {
  MAX_BACKFILL_AT_CREATE,
  materializeRecurringTransactions,
  nextOccurrence,
  projectedBackfill,
  purgeGenerated,
} from "@/lib/recurring";

import { requireAuth, type AuthedEnv } from "./_middleware";

const idParam = z.object({ id: z.string().optional() });
const bulkBody = z.object({ ids: z.array(z.string()) });

const recurringBody = insertRecurringTransactionSchema
  .omit({
    id: true,
    userId: true,
    lastGeneratedAt: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({ skipMissed: z.boolean().optional() });

const SCHEDULE_FIELDS = ["startDate", "frequency", "interval"] as const;

const requireId = (id?: string) => {
  if (!id) throw new HTTPException(400, { message: API_ERRORS.missingId });
  return id;
};

async function safeMaterialize(userId: string) {
  try {
    await materializeRecurringTransactions(userId);
  } catch (error) {
    console.error("[recurring] materialize failed", error);
  }
}

async function assertOwnedRefs(
  userId: string,
  accountId: string,
  categoryId?: string | null
) {
  const [account] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.id, accountId)));

  if (!account) {
    throw new HTTPException(400, { message: "Unknown account" });
  }

  if (!categoryId) return;

  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.userId, userId), eq(categories.id, categoryId)));

  if (!category) {
    throw new HTTPException(400, { message: "Unknown category" });
  }
}

async function loadTemplates(userId: string, templateId?: string) {
  const filters = [eq(recurringTransactions.userId, userId)];

  if (templateId) filters.push(eq(recurringTransactions.id, templateId));

  const rows = await db
    .select({
      template: recurringTransactions,
      account: accounts.name,
      category: categories.name,
    })
    .from(recurringTransactions)
    .innerJoin(accounts, eq(recurringTransactions.accountId, accounts.id))
    .leftJoin(categories, eq(recurringTransactions.categoryId, categories.id))
    .where(and(...filters));

  const counts = await db
    .select({
      recurringId: transactions.recurringId,
      generated: count(),
    })
    .from(transactions)
    .where(
      inArray(
        transactions.recurringId,
        rows.map((row) => row.template.id)
      )
    )
    .groupBy(transactions.recurringId);

  const generatedById = new Map(
    counts.map((row) => [row.recurringId, row.generated])
  );

  return rows.map(({ template, account, category }) => ({
    ...template,
    account,
    category,
    nextOccurrence: nextOccurrence(template),
    generatedCount: generatedById.get(template.id) ?? 0,
  }));
}

const app = new Hono<AuthedEnv>()
  .use("*", clerkMiddleware(), requireAuth)
  .get("/", async (c) => {
    await safeMaterialize(c.get("userId"));

    return c.json({ data: await loadTemplates(c.get("userId")) });
  })
  .get("/:id", zValidator("param", idParam), async (c) => {
    const id = requireId(c.req.valid("param").id);
    const [data] = await loadTemplates(c.get("userId"), id);

    if (!data) {
      throw new HTTPException(404, { message: API_ERRORS.notFound });
    }

    return c.json({ data });
  })
  .post("/", zValidator("json", recurringBody), async (c) => {
    const userId = c.get("userId");
    const { skipMissed, ...values } = c.req.valid("json");

    await assertOwnedRefs(userId, values.accountId, values.categoryId);

    const projected = projectedBackfill(values, values.endDate ?? null);

    if (projected > MAX_BACKFILL_AT_CREATE) {
      throw new HTTPException(400, {
        message: `That schedule would create ${projected} past transactions. Move the start date closer or widen the interval.`,
      });
    }

    const [data] = await db
      .insert(recurringTransactions)
      .values({
        ...values,
        endDate: values.endDate ?? null,
        id: createId(),
        userId,
        lastGeneratedAt: skipMissed ? new Date() : null,
      })
      .returning();

    await safeMaterialize(userId);

    return c.json({ data });
  })
  .post("/bulk-delete", zValidator("json", bulkBody), async (c) => {
    const data = await db
      .delete(recurringTransactions)
      .where(
        and(
          eq(recurringTransactions.userId, c.get("userId")),
          inArray(recurringTransactions.id, c.req.valid("json").ids)
        )
      )
      .returning({ id: recurringTransactions.id });

    return c.json({ data });
  })
  .post("/:id/run", zValidator("param", idParam), async (c) => {
    requireId(c.req.valid("param").id);

    const result = await materializeRecurringTransactions(c.get("userId"));

    return c.json({ data: { inserted: result.inserted } });
  })
  .patch(
    "/:id",
    zValidator("param", idParam),
    zValidator("json", recurringBody),
    async (c) => {
      const id = requireId(c.req.valid("param").id);
      const userId = c.get("userId");
      const { skipMissed, ...values } = c.req.valid("json");

      await assertOwnedRefs(userId, values.accountId, values.categoryId);

      const [existing] = await db
        .select()
        .from(recurringTransactions)
        .where(
          and(
            eq(recurringTransactions.userId, userId),
            eq(recurringTransactions.id, id)
          )
        );

      if (!existing) {
        throw new HTTPException(404, { message: API_ERRORS.notFound });
      }

      const scheduleChanged = SCHEDULE_FIELDS.some((field) =>
        field === "startDate"
          ? existing.startDate.getTime() !== values.startDate.getTime()
          : existing[field] !== values[field]
      );

      const purgedTransactions = scheduleChanged ? await purgeGenerated(id) : 0;

      const [data] = await db
        .update(recurringTransactions)
        .set({
          ...values,
          endDate: values.endDate ?? null,
          updatedAt: new Date(),
          ...(skipMissed ? { lastGeneratedAt: new Date() } : {}),
          ...(scheduleChanged && !skipMissed ? { lastGeneratedAt: null } : {}),
        })
        .where(
          and(
            eq(recurringTransactions.userId, userId),
            eq(recurringTransactions.id, id)
          )
        )
        .returning();

      await safeMaterialize(userId);

      return c.json({ data, purgedTransactions });
    }
  )
  .delete(
    "/:id",
    zValidator("param", idParam),
    zValidator(
      "query",
      z.object({ deleteTransactions: z.string().optional() })
    ),
    async (c) => {
      const id = requireId(c.req.valid("param").id);
      const userId = c.get("userId");
      const shouldDelete = c.req.valid("query").deleteTransactions === "true";

      const deletedTransactions = shouldDelete ? await purgeGenerated(id) : 0;

      const [data] = await db
        .delete(recurringTransactions)
        .where(
          and(
            eq(recurringTransactions.userId, userId),
            eq(recurringTransactions.id, id)
          )
        )
        .returning({ id: recurringTransactions.id });

      if (!data) {
        throw new HTTPException(404, { message: API_ERRORS.notFound });
      }

      return c.json({ data, deletedTransactions });
    }
  );

export default app;
