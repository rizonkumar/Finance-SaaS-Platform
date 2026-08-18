import type { recurringTransactions, transactions } from "@/db/schema";
import {
  addDaysUTC,
  addMonthsUTC,
  dateKeyUTC,
  toUtcNoon,
} from "@/lib/date-utc";

export const MAX_OCCURRENCES_PER_TEMPLATE = 60;
export const MAX_INSERTS_PER_RUN = 300;
export const MAX_BACKFILL_AT_CREATE = 500;

export type RecurringTemplate = typeof recurringTransactions.$inferSelect;

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
  template: RecurringTemplate,
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

type PlannedRow = typeof transactions.$inferInsert;

type TemplatePlan = {
  rows: PlannedRow[];
  latest: Date | null;
};

function planTemplate(
  template: RecurringTemplate,
  today: Date,
  budget: number
): TemplatePlan {
  const end = template.endDate ? toUtcNoon(template.endDate) : null;
  const horizon = end && end < today ? end : today;
  const watermark = template.lastGeneratedAt
    ? toUtcNoon(template.lastGeneratedAt)
    : null;

  const limit = Math.min(budget, MAX_OCCURRENCES_PER_TEMPLATE);
  const rows: PlannedRow[] = [];
  let index = seekIndex(template, watermark);
  let latest: Date | null = null;

  while (rows.length < limit) {
    const occurrence = occurrenceAt(template, index);

    if (occurrence > horizon) break;

    rows.push({
      id: generatedTransactionId(template.id, occurrence),
      amount: template.amount,
      payee: template.payee,
      notes: template.notes,
      date: occurrence,
      accountId: template.accountId,
      categoryId: template.categoryId,
      recurringId: template.id,
    });

    latest = occurrence;
    index++;
  }

  return { rows, latest };
}

export function planOccurrences(
  templates: RecurringTemplate[],
  today: Date
): { rows: PlannedRow[]; watermarks: { id: string; date: Date }[] } {
  const rows: PlannedRow[] = [];
  const watermarks: { id: string; date: Date }[] = [];

  for (const template of templates) {
    const budget = MAX_INSERTS_PER_RUN - rows.length;

    if (budget <= 0) break;

    const plan = planTemplate(template, today, budget);

    rows.push(...plan.rows);

    if (plan.latest) {
      watermarks.push({ id: template.id, date: plan.latest });
    }
  }

  return { rows, watermarks };
}
