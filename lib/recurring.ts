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
import {
  accounts,
  debtPayments,
  debts,
  recurringTransactions,
  transactions,
} from "@/db/schema";
import { toUtcNoon } from "@/lib/date-utc";
import { paidByDebt } from "@/lib/debt-ledger";
import { outstandingBalance } from "@/lib/debts";
import {
  MAX_INSERTS_PER_RUN,
  planOccurrences,
  type PlannableTemplate,
} from "@/lib/recurrence";

const THROTTLE_MS = 30_000;

const lastRunByUser = new Map<string, number>();

type TemplateRow = Omit<PlannableTemplate, "debtRemaining"> & {
  debtPrincipal: number | null;
};

async function loadPlannableTemplates(
  userId: string,
  today: Date,
  recurringId?: string
): Promise<PlannableTemplate[]> {
  const destination = alias(accounts, "destination_account");

  const filters = [
    eq(recurringTransactions.userId, userId),
    eq(recurringTransactions.isActive, true),
    lte(recurringTransactions.startDate, today),
    or(
      isNull(recurringTransactions.lastGeneratedAt),
      lte(recurringTransactions.lastGeneratedAt, today)
    ),
  ];

  if (recurringId) filters.push(eq(recurringTransactions.id, recurringId));

  const rows: TemplateRow[] = await db
    .select({
      ...getTableColumns(recurringTransactions),
      accountName: accounts.name,
      toAccountName: destination.name,
      debtPrincipal: debts.principal,
    })
    .from(recurringTransactions)
    .innerJoin(accounts, eq(recurringTransactions.accountId, accounts.id))
    .leftJoin(
      destination,
      eq(recurringTransactions.toAccountId, destination.id)
    )
    .leftJoin(debts, eq(recurringTransactions.debtId, debts.id))
    .where(and(...filters));

  const debtIds = [
    ...new Set(
      rows.map((row) => row.debtId).filter((id): id is string => Boolean(id))
    ),
  ];

  const paidTotals = await paidByDebt(userId, debtIds);

  return rows.map(({ debtPrincipal, ...row }) => ({
    ...row,
    debtRemaining:
      row.debtId && debtPrincipal !== null
        ? outstandingBalance(debtPrincipal, paidTotals.get(row.debtId) ?? 0)
        : null,
  }));
}

export async function materializeRecurringTransactions(
  userId: string,
  recurringId?: string
) {
  const startedAt = Date.now();
  const last = lastRunByUser.get(userId);
  const throttled = Boolean(last && startedAt - last < THROTTLE_MS);

  // An explicit run is a direct user action on one schedule, so it bypasses the
  // throttle that exists only to keep incidental page reads cheap.
  if (throttled && !recurringId) {
    return { inserted: 0, skipped: true, capped: false };
  }

  const today = toUtcNoon(new Date());
  const templates = await loadPlannableTemplates(userId, today, recurringId);

  const markRun = () => {
    if (!recurringId) lastRunByUser.set(userId, startedAt);
  };

  if (templates.length === 0) {
    markRun();
    return { inserted: 0, skipped: false, capped: false };
  }

  const { rows, payments, watermarks } = planOccurrences(templates, today);

  if (rows.length === 0) {
    markRun();
    return { inserted: 0, skipped: false, capped: false };
  }

  const cases = watermarks.map(
    (mark) =>
      sql`when ${recurringTransactions.id} = ${mark.id} then ${mark.date}::timestamp`
  );

  const inserted = await db.transaction(async (tx) => {
    const written = await tx
      .insert(transactions)
      .values(rows)
      .onConflictDoNothing({ target: transactions.id })
      .returning({ id: transactions.id });

    if (payments.length > 0) {
      await tx
        .insert(debtPayments)
        .values(payments)
        .onConflictDoNothing({ target: debtPayments.id });
    }

    await tx
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

    return written.length;
  });

  const capped = rows.length >= MAX_INSERTS_PER_RUN;

  if (!capped) markRun();

  return { inserted, skipped: false, capped };
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
  generatedDebtPaymentId,
  generatedTransactionId,
  generatedTransferId,
  nextOccurrence,
  occurrenceAt,
  projectedBackfill,
  MAX_BACKFILL_AT_CREATE,
  type RecurringTemplate,
} from "@/lib/recurrence";
