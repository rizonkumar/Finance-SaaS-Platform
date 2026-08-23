import { and, eq, inArray } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import { db } from "@/db/drizzle";
import { accounts, type categories } from "@/db/schema";
import { API_ERRORS } from "@/lib/messages";

export const idParam = z.object({ id: z.string().optional() });

export const bulkBody = z.object({ ids: z.array(z.string()) });

export const nameSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

type OwnedTable = typeof accounts | typeof categories;

export function requireId(id?: string) {
  if (!id) throw new HTTPException(400, { message: API_ERRORS.missingId });
  return id;
}

export function requireRow<T>(row: T | undefined): T {
  if (!row) throw new HTTPException(404, { message: API_ERRORS.notFound });
  return row;
}

export function deleteOwnedRow(table: OwnedTable, userId: string, id: string) {
  return db
    .delete(table)
    .where(and(eq(table.userId, userId), eq(table.id, id)))
    .returning({ id: table.id });
}

export function deleteOwnedRows(
  table: OwnedTable,
  userId: string,
  ids: string[]
) {
  return db
    .delete(table)
    .where(and(eq(table.userId, userId), inArray(table.id, ids)))
    .returning({ id: table.id });
}

export async function assertAccountOwned(
  userId: string,
  accountId?: string | null
) {
  if (!accountId) return;

  const [owned] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.id, accountId)));

  if (!owned) {
    throw new HTTPException(400, {
      message: "That account could not be found",
    });
  }
}

export const isDuplicateNameError = (error: unknown, indexName: string) =>
  String(error).includes(indexName);

export const duplicateNameConflict = (message: string) =>
  new HTTPException(409, { message });
