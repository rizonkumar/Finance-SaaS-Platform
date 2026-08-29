import type {
  debtPayments,
  recurringTransactions,
  transactions,
} from "@/db/schema";
import {
  addDaysUTC,
  addMonthsUTC,
  dateKeyUTC,
  toUtcNoon,
} from "@/lib/date-utc";
import { buildTransferLegs } from "@/lib/transfers";

export const MAX_OCCURRENCES_PER_TEMPLATE = 60;
export const MAX_INSERTS_PER_RUN = 300;
export const MAX_BACKFILL_AT_CREATE = 500;

export type RecurringTemplate = typeof recurringTransactions.$inferSelect;

export type PlannableTemplate = RecurringTemplate & {
  accountName: string;
  toAccountName: string | null;
  debtRemaining: number | null;
};

export type RecurrenceRule = Pick<
  RecurringTemplate,
  "startDate" | "frequency" | "interval"
>;

export function occurrenceAt(rule: RecurrenceRule, index: number): Date {
  const anchor = toUtcNoon(rule.startDate);
  const steps = index * rule.interval;

  switch (rule.frequency) {
    case "daily":
      return addDaysUTC(anchor, steps);
    case "weekly":
      return addDaysUTC(anchor, steps * 7);
    case "monthly":
      return addMonthsUTC(anchor, steps);
    case "yearly":
      return addMonthsUTC(anchor, steps * 12);
  }
}

function estimateIndex(rule: RecurrenceRule, watermark: Date): number {
  const anchor = toUtcNoon(rule.startDate);
  const days = Math.floor(
    (watermark.getTime() - anchor.getTime()) / 86_400_000
  );
  const months =
    (watermark.getUTCFullYear() - anchor.getUTCFullYear()) * 12 +
    (watermark.getUTCMonth() - anchor.getUTCMonth());

  switch (rule.frequency) {
    case "daily":
      return Math.floor(days / rule.interval);
    case "weekly":
      return Math.floor(days / (7 * rule.interval));
    case "monthly":
      return Math.floor(months / rule.interval);
    case "yearly":
      return Math.floor(months / (12 * rule.interval));
  }
}

export function seekIndex(
  rule: RecurrenceRule,
  watermark: Date | null
): number {
  if (!watermark) return 0;

  const anchor = toUtcNoon(rule.startDate);
  const mark = toUtcNoon(watermark);

  if (mark < anchor) return 0;

  let index = Math.max(0, estimateIndex(rule, mark));

  while (index > 0 && occurrenceAt(rule, index) > mark) index--;
  while (occurrenceAt(rule, index) <= mark) index++;

  return index;
}

export function nextOccurrence(
  template: RecurrenceRule & { isActive: boolean; endDate: Date | null },
  from: Date = new Date()
): Date | null {
  if (!template.isActive) return null;

  const occurrence = occurrenceAt(
    template,
    seekIndex(template, toUtcNoon(from))
  );

  if (template.endDate && occurrence > toUtcNoon(template.endDate)) return null;

  return occurrence;
}

export function projectedBackfill(
  rule: RecurrenceRule,
  endDate: Date | null,
  today: Date = new Date()
): number {
  const horizonToday = toUtcNoon(today);
  const horizon =
    endDate && toUtcNoon(endDate) < horizonToday
      ? toUtcNoon(endDate)
      : horizonToday;

  let count = 0;

  while (
    count <= MAX_BACKFILL_AT_CREATE + 1 &&
    occurrenceAt(rule, count) <= horizon
  ) {
    count++;
  }

  return count;
}

export const generatedTransactionId = (recurringId: string, occurrence: Date) =>
  `rt_${recurringId}_${dateKeyUTC(occurrence)}`;

export const generatedTransferId = (recurringId: string, occurrence: Date) =>
  `rtr_${recurringId}_${dateKeyUTC(occurrence)}`;

export const generatedDebtPaymentId = (recurringId: string, occurrence: Date) =>
  `rdp_${recurringId}_${dateKeyUTC(occurrence)}`;

type PlannedRow = typeof transactions.$inferInsert;

type PlannedPayment = typeof debtPayments.$inferInsert;

type TemplatePlan = {
  rows: PlannedRow[];
  payments: PlannedPayment[];
  latest: Date | null;
};

function occurrenceRows(
  template: PlannableTemplate,
  occurrence: Date
): PlannedRow[] {
  const occurrenceId = generatedTransactionId(template.id, occurrence);

  if (!template.toAccountId || !template.toAccountName) {
    return [
      {
        id: occurrenceId,
        amount: template.amount,
        payee: template.payee,
        notes: template.notes,
        date: occurrence,
        accountId: template.accountId,
        categoryId: template.categoryId,
        recurringId: template.id,
      },
    ];
  }

  const [outgoing, incoming] = buildTransferLegs({
    amount: template.amount,
    date: occurrence,
    notes: template.notes,
    source: { id: template.accountId, name: template.accountName },
    destination: { id: template.toAccountId, name: template.toAccountName },
  });

  const shared = {
    recurringId: template.id,
    transferId: generatedTransferId(template.id, occurrence),
  };

  return [
    { ...outgoing, ...shared, id: `${occurrenceId}_out` },
    { ...incoming, ...shared, id: `${occurrenceId}_in` },
  ];
}

function occurrencePayment(
  template: PlannableTemplate,
  occurrence: Date
): PlannedPayment | null {
  if (!template.debtId) return null;

  return {
    id: generatedDebtPaymentId(template.id, occurrence),
    userId: template.userId,
    debtId: template.debtId,
    amount: -template.amount,
    notes: template.notes,
    date: occurrence,
    transactionId: generatedTransactionId(template.id, occurrence),
  };
}

type OwedLedger = Map<string, number>;

function seedOwed(templates: PlannableTemplate[]): OwedLedger {
  const owed: OwedLedger = new Map();

  for (const template of templates) {
    if (template.debtId && template.debtRemaining !== null) {
      owed.set(template.debtId, template.debtRemaining);
    }
  }

  return owed;
}

function isCleared(template: PlannableTemplate, owed: OwedLedger): boolean {
  if (!template.debtId || template.amount >= 0) return false;

  const remaining = owed.get(template.debtId);

  return remaining !== undefined && remaining <= 0;
}

function drawDown(owed: OwedLedger, payment: PlannedPayment) {
  const remaining = owed.get(payment.debtId);

  if (remaining === undefined) return;

  owed.set(payment.debtId, remaining - payment.amount);
}

function planTemplate(
  template: PlannableTemplate,
  today: Date,
  budget: number,
  owed: OwedLedger
): TemplatePlan {
  const end = template.endDate ? toUtcNoon(template.endDate) : null;
  const horizon = end && end < today ? end : today;
  const watermark = template.lastGeneratedAt
    ? toUtcNoon(template.lastGeneratedAt)
    : null;

  const rows: PlannedRow[] = [];
  const payments: PlannedPayment[] = [];
  let index = seekIndex(template, watermark);
  let occurrences = 0;
  let latest: Date | null = null;

  while (occurrences < MAX_OCCURRENCES_PER_TEMPLATE) {
    const occurrence = occurrenceAt(template, index);

    if (occurrence > horizon) break;
    if (isCleared(template, owed)) break;

    const planned = occurrenceRows(template, occurrence);

    if (rows.length + planned.length > budget) break;

    rows.push(...planned);

    const payment = occurrencePayment(template, occurrence);

    if (payment) {
      payments.push(payment);
      drawDown(owed, payment);
    }

    latest = occurrence;
    occurrences++;
    index++;
  }

  return { rows, payments, latest };
}

export function planOccurrences(
  templates: PlannableTemplate[],
  today: Date
): {
  rows: PlannedRow[];
  payments: PlannedPayment[];
  watermarks: { id: string; date: Date }[];
} {
  const rows: PlannedRow[] = [];
  const payments: PlannedPayment[] = [];
  const watermarks: { id: string; date: Date }[] = [];
  const owed = seedOwed(templates);

  for (const template of templates) {
    const budget = MAX_INSERTS_PER_RUN - rows.length;

    if (budget <= 0) break;

    const plan = planTemplate(template, today, budget, owed);

    rows.push(...plan.rows);
    payments.push(...plan.payments);

    if (plan.latest) {
      watermarks.push({ id: template.id, date: plan.latest });
    }
  }

  return { rows, payments, watermarks };
}
