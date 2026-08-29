import { clerkMiddleware } from "@clerk/hono";
import { zValidator } from "@hono/zod-validator";
import { createId } from "@paralleldrive/cuid2";
import { and, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import { db } from "@/db/drizzle";
import { accounts, transactions } from "@/db/schema";
import { API_ERRORS } from "@/lib/messages";
import { buildTransferLegs, readTransferLegs } from "@/lib/transfers";

import { requireId } from "./_helpers";
import { requireAuth, type AuthedEnv } from "./_middleware";

const idParam = z.object({ id: z.string().optional() });

const transferBody = z
  .object({
    date: z.coerce.date(),
    amount: z.coerce
      .number()
      .int()
      .refine((value) => value > 0, "Enter an amount"),
    fromAccountId: z.string().min(1, "Pick an account to move money from"),
    toAccountId: z.string().min(1, "Pick an account to move money to"),
    notes: z.string().trim().nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.fromAccountId === value.toAccountId) {
      ctx.addIssue({
        code: "custom",
        path: ["toAccountId"],
        message: "Pick two different accounts",
      });
    }
  });

type TransferBody = z.output<typeof transferBody>;

async function resolveParties(userId: string, values: TransferBody) {
  const rows = await db
    .select({ id: accounts.id, name: accounts.name })
    .from(accounts)
    .where(
      and(
        eq(accounts.userId, userId),
        inArray(accounts.id, [values.fromAccountId, values.toAccountId])
      )
    );

  const byId = new Map(rows.map((row) => [row.id, row]));
  const source = byId.get(values.fromAccountId);
  const destination = byId.get(values.toAccountId);

  if (!source || !destination) {
    throw new HTTPException(400, {
      message: "That account could not be found",
    });
  }

  return { source, destination };
}

function legValues(
  transferId: string,
  values: TransferBody,
  parties: {
    source: { id: string; name: string };
    destination: { id: string; name: string };
  }
) {
  return buildTransferLegs({
    amount: values.amount,
    date: values.date,
    notes: values.notes ?? null,
    ...parties,
  }).map((leg) => ({ ...leg, id: createId(), transferId }));
}

async function loadLegs(userId: string, transferId: string) {
  return db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      date: transactions.date,
      notes: transactions.notes,
      accountId: transactions.accountId,
      account: accounts.name,
    })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(
      and(eq(accounts.userId, userId), eq(transactions.transferId, transferId))
    );
}

async function requireLegs(userId: string, transferId: string) {
  const legs = readTransferLegs(await loadLegs(userId, transferId));

  if (!legs) throw new HTTPException(404, { message: API_ERRORS.notFound });

  return legs;
}

const app = new Hono<AuthedEnv>()
  .use("*", clerkMiddleware(), requireAuth)
  .get("/:id", zValidator("param", idParam), async (c) => {
    const id = requireId(c.req.valid("param").id);
    const { source, destination } = await requireLegs(c.get("userId"), id);

    return c.json({
      data: {
        id,
        date: source.date,
        amount: Math.abs(source.amount),
        notes: source.notes,
        fromAccountId: source.accountId,
        fromAccount: source.account,
        toAccountId: destination.accountId,
        toAccount: destination.account,
      },
    });
  })
  .post("/", zValidator("json", transferBody), async (c) => {
    const userId = c.get("userId");
    const values = c.req.valid("json");
    const parties = await resolveParties(userId, values);
    const transferId = createId();

    await db
      .insert(transactions)
      .values(legValues(transferId, values, parties));

    return c.json({ data: { id: transferId } });
  })
  .patch(
    "/:id",
    zValidator("param", idParam),
    zValidator("json", transferBody),
    async (c) => {
      const userId = c.get("userId");
      const id = requireId(c.req.valid("param").id);
      const values = c.req.valid("json");

      const existing = await requireLegs(userId, id);
      const parties = await resolveParties(userId, values);

      await db.batch([
        db
          .delete(transactions)
          .where(
            inArray(transactions.id, [
              existing.source.id,
              existing.destination.id,
            ])
          ),
        db.insert(transactions).values(legValues(id, values, parties)),
      ]);

      return c.json({ data: { id } });
    }
  )
  .delete("/:id", zValidator("param", idParam), async (c) => {
    const userId = c.get("userId");
    const id = requireId(c.req.valid("param").id);
    const { source, destination } = await requireLegs(userId, id);

    await db
      .delete(transactions)
      .where(inArray(transactions.id, [source.id, destination.id]));

    return c.json({ data: { id } });
  });

export default app;
