import { describe, expect, it } from "vitest";

import { dateKeyUTC, utcNoon } from "@/lib/date-utc";
import {
  buildCashflowForecast,
  projectRecurringEvents,
  type ForecastTemplate,
} from "@/lib/forecast";

const days = (startDay: number, count: number) =>
  Array.from({ length: count }, (_, index) =>
    utcNoon(2026, 0, startDay + index)
  );

const template = (
  overrides: Partial<ForecastTemplate> = {}
): ForecastTemplate => ({
  id: "rec_1",
  amount: -10_000,
  payee: "Rent",
  accountId: "acc_1",
  account: "Checking",
  category: "Housing",
  frequency: "monthly",
  interval: 1,
  startDate: utcNoon(2026, 0, 1),
  endDate: null,
  isActive: true,
  ...overrides,
});

const eventKeys = (events: { date: Date }[]) =>
  events.map((event) => dateKeyUTC(event.date));

describe("projectRecurringEvents", () => {
  it("projects daily recurring events", () => {
    const events = projectRecurringEvents(
      [template({ frequency: "daily" })],
      utcNoon(2026, 0, 1),
      utcNoon(2026, 0, 3)
    );

    expect(eventKeys(events)).toEqual([
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
    ]);
  });

  it("projects weekly recurring events", () => {
    const events = projectRecurringEvents(
      [template({ frequency: "weekly" })],
      utcNoon(2026, 0, 1),
      utcNoon(2026, 0, 20)
    );

    expect(eventKeys(events)).toEqual([
      "2026-01-01",
      "2026-01-08",
      "2026-01-15",
    ]);
  });

  it("projects monthly recurring events", () => {
    const events = projectRecurringEvents(
      [template({ frequency: "monthly", startDate: utcNoon(2026, 0, 31) })],
      utcNoon(2026, 0, 1),
      utcNoon(2026, 2, 31)
    );

    expect(eventKeys(events)).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
    ]);
  });

  it("projects yearly recurring events", () => {
    const events = projectRecurringEvents(
      [template({ frequency: "yearly", startDate: utcNoon(2024, 1, 29) })],
      utcNoon(2026, 0, 1),
      utcNoon(2028, 11, 31)
    );

    expect(eventKeys(events)).toEqual([
      "2026-02-28",
      "2027-02-28",
      "2028-02-29",
    ]);
  });

  it("ignores inactive templates", () => {
    const events = projectRecurringEvents(
      [template({ isActive: false })],
      utcNoon(2026, 0, 1),
      utcNoon(2026, 0, 31)
    );

    expect(events).toEqual([]);
  });

  it("stops at the template end date", () => {
    const events = projectRecurringEvents(
      [
        template({
          frequency: "daily",
          endDate: utcNoon(2026, 0, 2),
        }),
      ],
      utcNoon(2026, 0, 1),
      utcNoon(2026, 0, 5)
    );

    expect(eventKeys(events)).toEqual(["2026-01-01", "2026-01-02"]);
  });

  it("filters by account", () => {
    const events = projectRecurringEvents(
      [
        template({ id: "rec_1", accountId: "acc_1" }),
        template({ id: "rec_2", accountId: "acc_2" }),
      ],
      utcNoon(2026, 0, 1),
      utcNoon(2026, 0, 1),
      "acc_2"
    );

    expect(events).toHaveLength(1);
    expect(events.at(0)?.accountId).toBe("acc_2");
  });
});

describe("buildCashflowForecast", () => {
  it("projects balances day by day", () => {
    const forecast = buildCashflowForecast({
      days: days(1, 3),
      accounts: [{ id: "acc_1", openingBalance: 100_000 }],
      movements: [{ accountId: "acc_1", amount: 25_000 }],
      templates: [
        template({
          frequency: "daily",
          amount: -10_000,
        }),
      ],
    });

    expect(forecast.openingBalance).toBe(125_000);
    expect(forecast.days.map((point) => point.balance)).toEqual([
      115_000, 105_000, 95_000,
    ]);
    expect(forecast.closingBalance).toBe(95_000);
    expect(forecast.projectedChange).toBe(-30_000);
    expect(forecast.lowestPoint).toMatchObject({
      date: utcNoon(2026, 0, 3),
      balance: 95_000,
    });
  });

  it("separates upcoming income and expenses", () => {
    const forecast = buildCashflowForecast({
      days: days(1, 1),
      accounts: [{ id: "acc_1", openingBalance: 0 }],
      movements: [],
      templates: [
        template({ id: "income", amount: 50_000, payee: "Salary" }),
        template({ id: "expense", amount: -15_000, payee: "Rent" }),
      ],
    });

    expect(forecast.upcomingIncome).toBe(50_000);
    expect(forecast.upcomingExpenses).toBe(15_000);
    expect(forecast.days.at(0)).toMatchObject({
      income: 50_000,
      expenses: 15_000,
      balance: 35_000,
    });
  });

  it("returns an empty but valid forecast with no days", () => {
    const forecast = buildCashflowForecast({
      days: [],
      accounts: [{ id: "acc_1", openingBalance: 100_000 }],
      movements: [],
      templates: [template()],
    });

    expect(forecast).toMatchObject({
      openingBalance: 100_000,
      closingBalance: 100_000,
      projectedChange: 0,
      lowestPoint: null,
      upcomingIncome: 0,
      upcomingExpenses: 0,
      days: [],
      events: [],
    });
  });
});
