import { createId } from "@paralleldrive/cuid2";
import { zValidator } from "@hono/zod-validator";
import { clerkMiddleware } from "@hono/clerk-auth";
import { and, eq, sql } from "drizzle-orm";
import { Hono } from "hono";

import { db } from "@/db/drizzle";
import { accounts, insertAccountSchema, transactions } from "@/db/schema";

import {
  bulkBody,
  deleteOwnedRow,
  deleteOwnedRows,
  idParam,
  requireId,
  requireRow,
} from "./_helpers";
import { requireAuth, type AuthedEnv } from "./_middleware";

const accountBody = insertAccountSchema
  .pick({ name: true, type: true, openingBalance: true })
  .partial({ type: true, openingBalance: true });

const writeColumns = {
  id: accounts.id,
  name: accounts.name,
  type: accounts.type,
  openingBalance: accounts.openingBalance,
};

const balanceColumns = {
  ...writeColumns,
  balance:
    sql`${accounts.openingBalance} + COALESCE(SUM(${transactions.amount}), 0)`.mapWith(
      Number
    ),
};

function selectAccounts(userId: string, id?: string) {
  return db
    .select(balanceColumns)
    .from(accounts)
    .leftJoin(transactions, eq(transactions.accountId, accounts.id))
    .where(
      and(eq(accounts.userId, userId), id ? eq(accounts.id, id) : undefined)
    )
    .groupBy(accounts.id)
    .orderBy(accounts.name);
}

const app = new Hono<AuthedEnv>()
  .use("*", clerkMiddleware(), requireAuth)
  .get("/", async (c) => {
    const data = await selectAccounts(c.get("userId"));

    return c.json({ data });
  })
  .get("/:id", zValidator("param", idParam), async (c) => {
    const id = requireId(c.req.valid("param").id);
    const [row] = await selectAccounts(c.get("userId"), id);

    return c.json({ data: requireRow(row) });
  })
  .post("/", zValidator("json", accountBody), async (c) => {
    const [data] = await db
      .insert(accounts)
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
      accounts,
      c.get("userId"),
      c.req.valid("json").ids
    );

    return c.json({ data });
  })
  .patch(
    "/:id",
    zValidator("param", idParam),
    zValidator("json", accountBody),
    async (c) => {
      const id = requireId(c.req.valid("param").id);

      const [row] = await db
        .update(accounts)
        .set(c.req.valid("json"))
        .where(and(eq(accounts.userId, c.get("userId")), eq(accounts.id, id)))
        .returning(writeColumns);

      return c.json({ data: requireRow(row) });
    }
  )
  .delete("/:id", zValidator("param", idParam), async (c) => {
    const [row] = await deleteOwnedRow(
      accounts,
      c.get("userId"),
      requireId(c.req.valid("param").id)
    );

    return c.json({ data: requireRow(row) });
  });

export default app;
