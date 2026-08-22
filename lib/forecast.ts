import { addDaysUTC, dateKeyUTC, toUtcNoon } from "@/lib/date-utc";
import { occurrenceAt, seekIndex } from "@/lib/recurrence";

export const MAX_FORECAST_OCCURRENCES_PER_TEMPLATE = 500;

export type ForecastAccount = {
  id: string;
  openingBalance: number;
};

export type ForecastMovement = {
  accountId: string;
  amount: number;
};

export type ForecastTemplate = {
  id: string;
  amount: number;
  payee: string;
  accountId: string;
  account?: string | null;
  category?: string | null;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
};

export type ForecastEvent = {
  id: string;
  recurringId: string;
  accountId: string;
  account: string | null;
  category: string | null;
  payee: string;
  amount: number;
  date: Date;
};

export type ForecastPoint = {
  date: Date;
  balance: number;
  income: number;
  expenses: number;
};

export type ForecastResult = {
  openingBalance: number;
  closingBalance: number;
  projectedChange: number;
  lowestPoint: { date: Date; balance: number } | null;
  upcomingIncome: number;
  upcomingExpenses: number;
  days: ForecastPoint[];
  events: ForecastEvent[];
};

type ForecastInput = {
  days: Date[];
  accounts: ForecastAccount[];
  movements: ForecastMovement[];
  templates: ForecastTemplate[];
  accountId?: string;
};

const eventId = (recurringId: string, occurrence: Date) =>
  `forecast_${recurringId}_${dateKeyUTC(occurrence)}`;

function accountMatches(template: ForecastTemplate, accountId?: string) {
  return !accountId || template.accountId === accountId;
}

export function projectRecurringEvents(
  templates: ForecastTemplate[],
  from: Date,
  to: Date,
  accountId?: string
): ForecastEvent[] {
  const start = toUtcNoon(from);
  const end = toUtcNoon(to);
  const events: ForecastEvent[] = [];

  for (const template of templates) {
    if (!template.isActive || !accountMatches(template, accountId)) continue;

    const templateEnd = template.endDate ? toUtcNoon(template.endDate) : null;
    if (templateEnd && templateEnd < start) continue;

    let index = seekIndex(template, addDaysUTC(start, -1));
    let generated = 0;

    while (generated < MAX_FORECAST_OCCURRENCES_PER_TEMPLATE) {
      const occurrence = occurrenceAt(template, index);

      if (occurrence > end || (templateEnd && occurrence > templateEnd)) break;

      events.push({
        id: eventId(template.id, occurrence),
        recurringId: template.id,
        accountId: template.accountId,
        account: template.account ?? null,
        category: template.category ?? null,
        payee: template.payee,
        amount: template.amount,
        date: occurrence,
      });

      index++;
      generated++;
    }
  }

  return events.sort((a, b) => {
    const dateDiff = a.date.getTime() - b.date.getTime();
    if (dateDiff !== 0) return dateDiff;

    return a.payee.localeCompare(b.payee);
  });
}

function openingBalances(input: ForecastInput) {
  const balances = new Map(
    input.accounts
      .filter((account) => !input.accountId || account.id === input.accountId)
      .map((account) => [account.id, account.openingBalance])
  );

  for (const movement of input.movements) {
    if (input.accountId && movement.accountId !== input.accountId) continue;

    balances.set(
      movement.accountId,
      (balances.get(movement.accountId) ?? 0) + movement.amount
    );
  }

  return balances;
}

function totalBalance(balances: Map<string, number>) {
  return [...balances.values()].reduce((total, balance) => total + balance, 0);
}

function groupEventsByDay(events: ForecastEvent[]) {
  const grouped = new Map<string, ForecastEvent[]>();

  for (const event of events) {
    const key = dateKeyUTC(event.date);
    const bucket = grouped.get(key);

    if (bucket) {
      bucket.push(event);
    } else {
      grouped.set(key, [event]);
    }
  }

  return grouped;
}

function lowestPoint(days: ForecastPoint[]) {
  if (days.length === 0) return null;

  return days.reduce((lowest, point) =>
    point.balance < lowest.balance ? point : lowest
  );
}

export function buildCashflowForecast(input: ForecastInput): ForecastResult {
  const balances = openingBalances(input);
  const openingBalance = totalBalance(balances);
  const firstDay = input.days.at(0);
  const lastDay = input.days.at(-1);
  const events =
    firstDay && lastDay
      ? projectRecurringEvents(
          input.templates,
          firstDay,
          lastDay,
          input.accountId
        )
      : [];
  const eventsByDay = groupEventsByDay(events);

  const days = input.days.map((day) => {
    let income = 0;
    let expenses = 0;

    for (const event of eventsByDay.get(dateKeyUTC(day)) ?? []) {
      balances.set(
        event.accountId,
        (balances.get(event.accountId) ?? 0) + event.amount
      );

      if (event.amount >= 0) {
        income += event.amount;
      } else {
        expenses += Math.abs(event.amount);
      }
    }

    return {
      date: day,
      balance: totalBalance(balances),
      income,
      expenses,
    };
  });

  const closingBalance = days.at(-1)?.balance ?? openingBalance;

  return {
    openingBalance,
    closingBalance,
    projectedChange: closingBalance - openingBalance,
    lowestPoint: lowestPoint(days),
    upcomingIncome: events.reduce(
      (total, event) => total + Math.max(event.amount, 0),
      0
    ),
    upcomingExpenses: events.reduce(
      (total, event) => total + Math.abs(Math.min(event.amount, 0)),
      0
    ),
    days,
    events,
  };
}
