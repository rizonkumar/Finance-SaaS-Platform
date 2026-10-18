import {
  addDaysUTC,
  daysInMonthUTC,
  endOfDayUTC,
  startOfDayUTC,
  startOfWeekUTC,
  utcNoon,
} from "@/lib/date-utc";

export const DEFAULT_WEEK_STARTS_ON = 1;

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

function weekWindow(today: Date, weekStartsOn: number): BudgetWindow {
  const firstDay = startOfWeekUTC(today, weekStartsOn);

  return {
    periodStart: startOfDayUTC(firstDay),
    periodEnd: endOfDayUTC(addDaysUTC(firstDay, 6)),
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
  today: Date = new Date(),
  weekStartsOn: number = DEFAULT_WEEK_STARTS_ON
): BudgetWindow {
  switch (budget.period) {
    case "weekly":
      return weekWindow(today, weekStartsOn);
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

export type DailySpend = {
  date: Date;
  categoryId: string | null;
  spent: number;
};

type SpendWindow = BudgetWindow & { categoryId: string | null };

export function spentInWindow(window: SpendWindow, daily: DailySpend[]) {
  const start = window.periodStart.getTime();
  const end = window.periodEnd.getTime();

  return daily.reduce((total, day) => {
    const time = day.date.getTime();
    const inPeriod = time >= start && time <= end;
    const inCategory =
      window.categoryId === null || day.categoryId === window.categoryId;

    return inPeriod && inCategory ? total + day.spent : total;
  }, 0);
}
