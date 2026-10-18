import { format } from "date-fns";

import { type CsvTable } from "@/lib/csv-export";
import { addMonthsUTC, dateKeyUTC, parseDayUTC, utcNoon } from "@/lib/date-utc";

export const REPORT_PERIOD_DAYS = 180;
export const REPORT_TOP_CATEGORIES = 6;
export const REPORT_TOP_PAYEES = 10;
export const UNCATEGORIZED_LABEL = "Uncategorized";
export const OTHER_LABEL = "Other";

export type ReportLine = {
  date: Date;
  category: string | null;
  income: number;
  expenses: number;
};

export type MonthlyFlow = {
  month: string;
  income: number;
  expenses: number;
  net: number;
};

export type CategoryTrendRow = {
  category: string;
  total: number;
  values: number[];
};

export const monthKey = (date: Date) => dateKeyUTC(date).slice(0, 7);

export function monthsBetween(start: Date, end: Date): string[] {
  const last = monthKey(end);
  const months: string[] = [];

  let cursor = utcNoon(start.getUTCFullYear(), start.getUTCMonth(), 1);

  while (monthKey(cursor) <= last) {
    months.push(monthKey(cursor));
    cursor = addMonthsUTC(cursor, 1);
  }

  return months;
}

export function savingsRate(income: number, expenses: number) {
  if (income <= 0) return 0;

  return ((income - expenses) / income) * 100;
}

export function buildMonthlyFlow(
  lines: ReportLine[],
  months: string[]
): MonthlyFlow[] {
  const flows = new Map(
    months.map((month) => [month, { month, income: 0, expenses: 0, net: 0 }])
  );

  for (const line of lines) {
    const flow = flows.get(monthKey(line.date));

    if (!flow) continue;

    flow.income += line.income;
    flow.expenses += line.expenses;
    flow.net = flow.income - flow.expenses;
  }

  return [...flows.values()];
}

export function summarizeFlow(flows: MonthlyFlow[]) {
  const income = flows.reduce((total, flow) => total + flow.income, 0);
  const expenses = flows.reduce((total, flow) => total + flow.expenses, 0);

  return {
    income,
    expenses,
    net: income - expenses,
    savingsRate: savingsRate(income, expenses),
  };
}

function spendingByCategory(lines: ReportLine[], months: string[]) {
  const position = new Map(months.map((month, index) => [month, index]));
  const rows = new Map<string, CategoryTrendRow>();

  for (const line of lines) {
    const index = position.get(monthKey(line.date));

    if (index === undefined || line.expenses === 0) continue;

    const category = line.category ?? UNCATEGORIZED_LABEL;
    const row = rows.get(category) ?? {
      category,
      total: 0,
      values: months.map(() => 0),
    };

    row.total += line.expenses;
    row.values[index] = (row.values[index] ?? 0) + line.expenses;
    rows.set(category, row);
  }

  return [...rows.values()].sort((a, b) => b.total - a.total);
}

export function buildCategoryTrend(
  lines: ReportLine[],
  months: string[],
  limit: number = REPORT_TOP_CATEGORIES
): CategoryTrendRow[] {
  const ranked = spendingByCategory(lines, months);
  const top = ranked.slice(0, limit);
  const rest = ranked.slice(limit);

  if (rest.length === 0) return top;

  return [
    ...top,
    {
      category: OTHER_LABEL,
      total: rest.reduce((total, row) => total + row.total, 0),
      values: months.map((_month, index) =>
        rest.reduce((total, row) => total + (row.values[index] ?? 0), 0)
      ),
    },
  ];
}

export const formatMonthLabel = (month: string) =>
  format(parseDayUTC(`${month}-01`), "LLL yy");

type ReportTableInput = {
  months: string[];
  monthly: MonthlyFlow[];
  categories: CategoryTrendRow[];
};

export function reportCsvTable({
  months,
  monthly,
  categories,
}: ReportTableInput): CsvTable {
  const flowRow = (label: string, pick: (flow: MonthlyFlow) => number) => {
    const values = monthly.map(pick);

    return [
      label,
      ...values,
      values.reduce((total, value) => total + value, 0),
    ];
  };

  return {
    headers: ["", ...months, "Total"],
    rows: [
      flowRow("Income", (flow) => flow.income),
      flowRow("Spending", (flow) => flow.expenses),
      flowRow("Net", (flow) => flow.net),
      ...categories.map((row) => [row.category, ...row.values, row.total]),
    ],
  };
}
