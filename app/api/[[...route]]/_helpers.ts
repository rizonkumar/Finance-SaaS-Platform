import { subDays } from "date-fns";
import { and, eq, inArray } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import { db } from "@/db/drizzle";
import {
  accounts,
  categories,
  type categoryRules,
  type savedViews,
  userSettings,
} from "@/db/schema";
import { DEFAULT_WEEK_STARTS_ON } from "@/lib/budgets";
import { DEFAULT_CURRENCY_CODE } from "@/lib/currency";
import {
  endOfDayUTC,
  parseDayUTC,
  shiftMinutes,
  startOfDayUTC,
} from "@/lib/date-utc";
import { API_ERRORS } from "@/lib/messages";

export const idParam = z.object({ id: z.string().optional() });

export const bulkBody = z.object({ ids: z.array(z.string()) });

export const nameSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

export const periodQuery = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  accountId: z.string().optional(),
  tzOffset: z.coerce.number().int().min(-840).max(840).optional(),
});

type OwnedTable =
  | typeof accounts
  | typeof categories
  | typeof categoryRules
  | typeof savedViews;

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

export function resolvePeriod(
  { from, to, tzOffset = 0 }: Omit<z.infer<typeof periodQuery>, "accountId">,
  defaultDays: number
) {
  const endDate = to
    ? shiftMinutes(endOfDayUTC(parseDayUTC(to)), tzOffset)
    : new Date();
  const startDate = from
    ? shiftMinutes(startOfDayUTC(parseDayUTC(from)), tzOffset)
    : subDays(endDate, defaultDays);

  return { startDate, endDate };
}

export async function assertCategoriesOwned(
  userId: string,
  ids: (string | null | undefined)[]
) {
  const wanted = [...new Set(ids.filter((id): id is string => Boolean(id)))];

  if (wanted.length === 0) return;

  const owned = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.userId, userId), inArray(categories.id, wanted)));

  if (owned.length !== wanted.length) {
    throw new HTTPException(400, {
      message: "That category could not be found",
    });
  }
}

export const DEFAULT_SETTINGS = {
  currency: DEFAULT_CURRENCY_CODE,
  weekStartsOn: DEFAULT_WEEK_STARTS_ON,
};

export async function loadSettings(userId: string) {
  const [row] = await db
    .select({
      currency: userSettings.currency,
      weekStartsOn: userSettings.weekStartsOn,
    })
    .from(userSettings)
    .where(eq(userSettings.userId, userId));

  return row ?? DEFAULT_SETTINGS;
}
