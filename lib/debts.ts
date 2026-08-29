import { startOfDayUTC } from "@/lib/date-utc";

export type DebtStatus =
  "cleared" | "ahead" | "on-track" | "behind" | "stalled" | "no-deadline";

export type PayoffStrategy = "snowball" | "avalanche";

const BASIS_POINTS = 10_000;
const MONTHS_PER_YEAR = 12;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_PER_MONTH = 365.25 / 12;

export const MAX_PROJECTION_MONTHS = 600;

const SETTLED = 0.5;

export const PAYOFF_TOLERANCE_MONTHS = 1;

export const aprFromBasisPoints = (basisPoints: number) => basisPoints / 100;

export const aprToBasisPoints = (percent: number) => Math.round(percent * 100);

export const monthlyRate = (aprBasisPoints: number) =>
  aprBasisPoints / BASIS_POINTS / MONTHS_PER_YEAR;

export const outstandingBalance = (principal: number, paid: number) =>
  Math.max(principal - paid, 0);

export function payoffPercentage(paid: number, principal: number): number {
  if (principal <= 0) return 0;

  return Math.min((paid / principal) * 100, 100);
}

export const monthlyInterest = (balance: number, aprBasisPoints: number) =>
  Math.max(balance, 0) * monthlyRate(aprBasisPoints);

export function monthsUntil(target: Date, today: Date = new Date()): number {
  const days =
    (startOfDayUTC(target).getTime() - startOfDayUTC(today).getTime()) /
    MS_PER_DAY;

  return days / DAYS_PER_MONTH;
}

export function monthsToPayoff(
  balance: number,
  aprBasisPoints: number,
  payment: number
): number | null {
  if (balance <= SETTLED) return 0;
  if (payment <= 0) return null;

  const rate = monthlyRate(aprBasisPoints);

  if (rate === 0) return balance / payment;
  if (payment <= balance * rate) return null;

  return -Math.log(1 - (rate * balance) / payment) / Math.log(1 + rate);
}

export function totalInterest(
  balance: number,
  aprBasisPoints: number,
  payment: number
): number | null {
  const months = monthsToPayoff(balance, aprBasisPoints, payment);

  if (months === null) return null;

  return Math.max(payment * months - balance, 0);
}

export function projectedPayoffDate(
  balance: number,
  aprBasisPoints: number,
  payment: number,
  today: Date = new Date()
): Date | null {
  const months = monthsToPayoff(balance, aprBasisPoints, payment);

  if (months === null) return null;

  return new Date(today.getTime() + months * DAYS_PER_MONTH * MS_PER_DAY);
}

export function requiredPayment(
  balance: number,
  aprBasisPoints: number,
  months: number
): number {
  if (balance <= SETTLED) return 0;
  if (months <= 0) return balance;

  const rate = monthlyRate(aprBasisPoints);

  if (rate === 0) return balance / months;

  return (balance * rate) / (1 - Math.pow(1 + rate, -months));
}

export function debtStatus(
  balance: number,
  aprBasisPoints: number,
  minimumPayment: number,
  targetDate: Date | null,
  today: Date = new Date()
): DebtStatus {
  if (balance <= SETTLED) return "cleared";

  const months = monthsToPayoff(balance, aprBasisPoints, minimumPayment);

  if (months === null) return "stalled";
  if (!targetDate) return "no-deadline";

  const available = monthsUntil(targetDate, today);

  if (months <= available - PAYOFF_TOLERANCE_MONTHS) return "ahead";
  if (months > available + PAYOFF_TOLERANCE_MONTHS) return "behind";

  return "on-track";
}

export type ScheduleDefaults = {
  payee: string;
  amount: number;
  frequency: "monthly";
  interval: number;
  endDate: Date | null;
};

export type SchedulableDebt = {
  name: string;
  balance: number;
  aprBasisPoints: number;
  minimumPayment: number;
};

export function scheduleDefaultsForDebt(
  debt: SchedulableDebt,
  today: Date = new Date()
): ScheduleDefaults {
  return {
    payee: `Debt: ${debt.name}`,
    amount: -Math.abs(debt.minimumPayment),
    frequency: "monthly",
    interval: 1,
    endDate: projectedPayoffDate(
      debt.balance,
      debt.aprBasisPoints,
      debt.minimumPayment,
      today
    ),
  };
}

export type PlanDebt = {
  id: string;
  name: string;
  balance: number;
  aprBasisPoints: number;
  minimumPayment: number;
};

export type PlanEntry = {
  id: string;
  name: string;
  monthsToClear: number | null;
  interestPaid: number;
};

export type PayoffPlan = {
  strategy: PayoffStrategy;
  order: PlanEntry[];
  months: number;
  totalInterest: number;
  totalPaid: number;
  clearedAll: boolean;
};

export function orderDebts<
  T extends { balance: number; aprBasisPoints: number },
>(debts: T[], strategy: PayoffStrategy): T[] {
  return [...debts].sort((a, b) =>
    strategy === "snowball"
      ? a.balance - b.balance || b.aprBasisPoints - a.aprBasisPoints
      : b.aprBasisPoints - a.aprBasisPoints || a.balance - b.balance
  );
}

type SimRow = PlanDebt & {
  interestPaid: number;
  monthsToClear: number | null;
};

const isSettled = (row: SimRow) => row.balance <= SETTLED;

const accrue = (row: SimRow) => {
  const interest = monthlyInterest(row.balance, row.aprBasisPoints);

  row.balance += interest;
  row.interestPaid += interest;
};

const applyPayment = (row: SimRow, budget: number) => {
  const applied = Math.min(Math.max(budget, 0), row.balance);

  row.balance -= applied;

  return applied;
};

function runMonth(
  rows: SimRow[],
  ordered: SimRow[],
  budget: number,
  month: number
): number {
  const active = rows.filter((row) => !isSettled(row));

  active.forEach(accrue);

  let left = budget;
  let paid = 0;

  for (const row of active) {
    const applied = applyPayment(row, Math.min(row.minimumPayment, left));

    left -= applied;
    paid += applied;
  }

  for (const row of ordered) {
    if (left <= 0) break;

    const applied = applyPayment(row, left);

    left -= applied;
    paid += applied;
  }

  for (const row of active) {
    if (isSettled(row) && row.monthsToClear === null) {
      row.monthsToClear = month;
    }
  }

  return paid;
}

export function simulatePayoff(
  debts: PlanDebt[],
  extraPerMonth: number,
  strategy: PayoffStrategy
): PayoffPlan {
  const rows: SimRow[] = debts.map((debt) => ({
    ...debt,
    balance: Math.max(debt.balance, 0),
    interestPaid: 0,
    monthsToClear: null,
  }));

  const ordered = orderDebts(rows, strategy);
  const budget =
    Math.max(extraPerMonth, 0) +
    rows.reduce((total, row) => total + row.minimumPayment, 0);

  let month = 0;
  let totalPaid = 0;

  while (month < MAX_PROJECTION_MONTHS && rows.some((row) => !isSettled(row))) {
    month += 1;
    totalPaid += runMonth(rows, ordered, budget, month);
  }

  return {
    strategy,
    order: ordered.map((row) => ({
      id: row.id,
      name: row.name,
      monthsToClear: row.monthsToClear,
      interestPaid: row.interestPaid,
    })),
    months: month,
    totalInterest: rows.reduce((total, row) => total + row.interestPaid, 0),
    totalPaid,
    clearedAll: rows.every(isSettled),
  };
}

export type StrategyComparison = {
  snowball: PayoffPlan;
  avalanche: PayoffPlan;
  recommended: PayoffStrategy;
  interestSaved: number;
  monthsSaved: number;
};

export function comparePayoffStrategies(
  debts: PlanDebt[],
  extraPerMonth: number
): StrategyComparison {
  const snowball = simulatePayoff(debts, extraPerMonth, "snowball");
  const avalanche = simulatePayoff(debts, extraPerMonth, "avalanche");

  const interestSaved = snowball.totalInterest - avalanche.totalInterest;

  return {
    snowball,
    avalanche,
    recommended: interestSaved > SETTLED ? "avalanche" : "snowball",
    interestSaved,
    monthsSaved: snowball.months - avalanche.months,
  };
}
