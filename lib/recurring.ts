import {
  and,
  eq,
  getTableColumns,
  inArray,
  isNull,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/db/drizzle";
import { accounts, recurringTransactions, transactions } from "@/db/schema";
import { toUtcNoon } from "@/lib/date-utc";
import { MAX_INSERTS_PER_RUN, planOccurrences } from "@/lib/recurrence";

const THROTTLE_MS = 30_000;

const lastRunByUser = new Map<string, number>();

export async function materializeRecurringTransactions(userId: string) {
  const startedAt = Date.now();
  const last = lastRunByUser.get(userId);

  if (last && startedAt - last < THROTTLE_MS) {
    return { inserted: 0, skipped: true, capped: false };
  }

  const today = toUtcNoon(new Date());

  const destination = alias(accounts, "destination_account");

  const templates = await db
    .select({
      ...getTableColumns(recurringTransactions),
      accountName: accounts.name,
      toAccountName: destination.name,
    })
    .from(recurringTransactions)
    .innerJoin(accounts, eq(recurringTransactions.accountId, accounts.id))
    .leftJoin(
      destination,
      eq(recurringTransactions.toAccountId, destination.id)
    )
    .where(
      and(
        eq(recurringTransactions.userId, userId),
        eq(recurringTransactions.isActive, true),
        lte(recurringTransactions.startDate, today),
        or(
          isNull(recurringTransactions.lastGeneratedAt),
          lte(recurringTransactions.lastGeneratedAt, today)
        )
      )
    );

  if (templates.length === 0) {
    lastRunByUser.set(userId, startedAt);
    return { inserted: 0, skipped: false, capped: false };
  }

  const { rows, watermarks } = planOccurrences(templates, today);

  if (rows.length === 0) {
    lastRunByUser.set(userId, startedAt);
    return { inserted: 0, skipped: false, capped: false };
  }

  const inserted = await db
    .insert(transactions)
    .values(rows)
    .onConflictDoNothing({ target: transactions.id })
    .returning({ id: transactions.id });

  const cases = watermarks.map(
    (mark) =>
      sql`when ${recurringTransactions.id} = ${mark.id} then ${mark.date}::timestamp`
  );

  await db
    .update(recurringTransactions)
    .set({
      lastGeneratedAt: sql`greatest(
        coalesce(${recurringTransactions.lastGeneratedAt}, 'epoch'::timestamp),
        (case ${sql.join(cases, sql` `)} else 'epoch'::timestamp end)
      )`,
      updatedAt: new Date(),
    })
    .where(
      inArray(
        recurringTransactions.id,
        watermarks.map((mark) => mark.id)
      )
    );

  const capped = rows.length >= MAX_INSERTS_PER_RUN;

  if (!capped) {
    lastRunByUser.set(userId, startedAt);
  }

  return { inserted: inserted.length, skipped: false, capped };
}

export async function purgeGenerated(recurringId: string) {
  const deleted = await db
    .delete(transactions)
    .where(eq(transactions.recurringId, recurringId))
    .returning({ id: transactions.id });

  await db
    .update(recurringTransactions)
    .set({ lastGeneratedAt: null, updatedAt: new Date() })
    .where(eq(recurringTransactions.id, recurringId));

  return deleted.length;
}

export {
  generatedTransactionId,
  generatedTransferId,
  nextOccurrence,
  occurrenceAt,
  projectedBackfill,
  MAX_BACKFILL_AT_CREATE,
  type RecurringTemplate,
} from "@/lib/recurrence";
