import { dateKeyUTC } from "@/lib/date-utc";

export const ACCOUNT_TYPES = [
  "checking",
  "savings",
  "cash",
  "investment",
  "credit",
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const LIABILITY_ACCOUNT_TYPES: readonly AccountType[] = ["credit"];

export const isLiabilityAccount = (type: AccountType) =>
  LIABILITY_ACCOUNT_TYPES.includes(type);

export const accountBalance = (openingBalance: number, movement: number) =>
  openingBalance + movement;

export const signOpeningBalance = (type: AccountType, amount: number) =>
  isLiabilityAccount(type) ? -Math.abs(amount) : amount;

export const displayOpeningBalance = (type: AccountType, amount: number) =>
  isLiabilityAccount(type) ? Math.abs(amount) : amount;

export type Position = { balance: number };

export type BalanceSheet = {
  assets: number;
  liabilities: number;
  netWorth: number;
};

export function buildBalanceSheet(
  positions: Position[],
  debtOwed = 0
): BalanceSheet {
  let assets = 0;
  let liabilities = Math.max(debtOwed, 0);

  for (const position of positions) {
    if (position.balance >= 0) {
      assets += position.balance;
    } else {
      liabilities -= position.balance;
    }
  }

  return { assets, liabilities, netWorth: assets - liabilities };
}

export type NetWorthPoint = {
  date: Date;
  assets: number;
  liabilities: number;
  netWorth: number;
};

export type AccountDelta = {
  accountId: string;
  date: Date;
  amount: number;
};

export type DebtDelta = {
  date: Date;
  amount: number;
};

type SeriesInput = {
  days: Date[];
  startingBalances: { id: string; balance: number }[];
  deltas: AccountDelta[];
  startingDebt: number;
  debtDeltas: DebtDelta[];
};

function groupByDay<T extends { date: Date }>(rows: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  for (const row of rows) {
    const key = dateKeyUTC(row.date);
    const bucket = grouped.get(key);

    if (bucket) {
      bucket.push(row);
    } else {
      grouped.set(key, [row]);
    }
  }

  return grouped;
}

export function buildNetWorthSeries(input: SeriesInput): NetWorthPoint[] {
  const balances = new Map(
    input.startingBalances.map((account) => [account.id, account.balance])
  );

  const deltasByDay = groupByDay(input.deltas);
  const debtDeltasByDay = groupByDay(input.debtDeltas);

  let debt = input.startingDebt;

  return input.days.map((day) => {
    const key = dateKeyUTC(day);

    for (const delta of deltasByDay.get(key) ?? []) {
      balances.set(
        delta.accountId,
        (balances.get(delta.accountId) ?? 0) + delta.amount
      );
    }

    for (const delta of debtDeltasByDay.get(key) ?? []) {
      debt += delta.amount;
    }

    const positions = [...balances.values()].map((balance) => ({ balance }));

    return { date: day, ...buildBalanceSheet(positions, debt) };
  });
}

export function netWorthChange(series: NetWorthPoint[]): number {
  const opening = series.at(0);
  const closing = series.at(-1);

  if (!opening || !closing) return 0;

  return closing.netWorth - opening.netWorth;
}
