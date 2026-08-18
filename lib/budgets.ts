import {
  addDaysUTC,
  daysInMonthUTC,
  endOfDayUTC,
  startOfDayUTC,
  utcNoon,
} from "@/lib/date-utc";

export type BudgetPeriod = "weekly" | "monthly" | "yearly" | "custom";

export type BudgetStatus = "on-track" | "warning" | "over";

export const WARNING_THRESHOLD = 75;
export const OVER_THRESHOLD = 100;

export type BudgetWindow = {
  periodStart: Date;
  periodEnd: Date;
};

type PeriodInput = {
  period: BudgetPeriod;
  startDate: Date;
  endDate: Date | null;
};

function isoWeekWindow(today: Date): BudgetWindow {
  const dayOfWeek = today.getUTCDay();
  const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = addDaysUTC(today, offsetToMonday);

  return {
    periodStart: startOfDayUTC(monday),
    periodEnd: endOfDayUTC(addDaysUTC(monday, 6)),
  };
}

function monthWindow(today: Date): BudgetWindow {
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth();

  return {
    periodStart: startOfDayUTC(utcNoon(year, month, 1)),
    periodEnd: endOfDayUTC(utcNoon(year, month, daysInMonthUTC(year, month))),
  };
}

function yearWindow(today: Date): BudgetWindow {
  const year = today.getUTCFullYear();

  return {
    periodStart: startOfDayUTC(utcNoon(year, 0, 1)),
    periodEnd: endOfDayUTC(utcNoon(year, 11, 31)),
  };
}

export function resolveBudgetPeriod(
  budget: PeriodInput,
  today: Date = new Date()
): BudgetWindow {
  switch (budget.period) {
    case "weekly":
      return isoWeekWindow(today);
    case "monthly":
      return monthWindow(today);
    case "yearly":
      return yearWindow(today);
    case "custom":
      return {
        periodStart: startOfDayUTC(budget.startDate),
        periodEnd: endOfDayUTC(budget.endDate ?? budget.startDate),
      };
  }
}

export function isBudgetActiveNow(
  budget: PeriodInput,
  today: Date = new Date()
): boolean {
  const now = today.getTime();

  if (now < startOfDayUTC(budget.startDate).getTime()) return false;
  if (budget.endDate && now > endOfDayUTC(budget.endDate).getTime()) {
    return false;
  }

  return true;
}

export function budgetPercentage(spent: number, amount: number): number {
  if (amount <= 0) return 0;

  return (spent / amount) * 100;
}

export function budgetStatus(percentage: number): BudgetStatus {
  if (percentage > OVER_THRESHOLD) return "over";
  if (percentage >= WARNING_THRESHOLD) return "warning";

  return "on-track";
}
