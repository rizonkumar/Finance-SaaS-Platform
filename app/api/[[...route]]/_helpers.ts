import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

import { db } from "@/db/drizzle";
import { accounts } from "@/db/schema";
import { API_ERRORS } from "@/lib/messages";

export function requireId(id?: string) {
  if (!id) throw new HTTPException(400, { message: API_ERRORS.missingId });
  return id;
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
    throw new HTTPException(400, { message: "Unknown account" });
  }
}

export const isDuplicateNameError = (error: unknown, indexName: string) =>
  String(error).includes(indexName);

export const duplicateNameConflict = (message: string) =>
  new HTTPException(409, { message });
