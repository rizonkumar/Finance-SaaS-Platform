import { describe, expect, it } from "vitest";

import {
  accountBalance,
  buildBalanceSheet,
  buildNetWorthSeries,
  displayOpeningBalance,
  isLiabilityAccount,
  netWorthChange,
  signOpeningBalance,
} from "@/lib/net-worth";

const utc = (iso: string) => new Date(`${iso}T12:00:00.000Z`);

const days = [utc("2026-03-01"), utc("2026-03-02"), utc("2026-03-03")];

describe("isLiabilityAccount", () => {
  it("treats credit and loans as borrowed money", () => {
    expect(isLiabilityAccount("credit")).toBe(true);
    expect(isLiabilityAccount("loan")).toBe(true);
  });

  it("treats every cash-like account as an asset", () => {
    expect(isLiabilityAccount("savings")).toBe(false);
    expect(isLiabilityAccount("cash")).toBe(false);
    expect(isLiabilityAccount("wallet")).toBe(false);
    expect(isLiabilityAccount("investment")).toBe(false);
    expect(isLiabilityAccount("fixed_deposit")).toBe(false);
    expect(isLiabilityAccount("ppf")).toBe(false);
    expect(isLiabilityAccount("epf")).toBe(false);
  });
});

describe("accountBalance", () => {
  it("adds movement to the opening balance", () => {
    expect(accountBalance(100_000, -30_000)).toBe(70_000);
  });

  it("can go below zero", () => {
    expect(accountBalance(10_000, -25_000)).toBe(-15_000);
  });
});

describe("signOpeningBalance", () => {
  it("stores what a card owes below zero", () => {
    expect(signOpeningBalance("credit", 45_000)).toBe(-45_000);
  });

  it("keeps a card negative even when entered negative", () => {
    expect(signOpeningBalance("credit", -45_000)).toBe(-45_000);
  });

  it("leaves an asset account exactly as entered", () => {
    expect(signOpeningBalance("savings", 45_000)).toBe(45_000);
  });

  it("stores a loan as money owed", () => {
    expect(signOpeningBalance("loan", 250_000)).toBe(-250_000);
  });

  it("allows an overdrawn asset account", () => {
    expect(signOpeningBalance("savings", -2_000)).toBe(-2_000);
  });
});

describe("displayOpeningBalance", () => {
  it("shows what a card owes as a positive figure", () => {
    expect(displayOpeningBalance("credit", -45_000)).toBe(45_000);
  });

  it("round-trips an asset account", () => {
    expect(displayOpeningBalance("savings", -2_000)).toBe(-2_000);
  });
});

describe("buildBalanceSheet", () => {
  it("sums positive balances into assets", () => {
    const sheet = buildBalanceSheet([{ balance: 60_000 }, { balance: 40_000 }]);

    expect(sheet).toEqual({
      assets: 100_000,
      liabilities: 0,
      netWorth: 100_000,
    });
  });

  it("counts a negative balance as a liability", () => {
    const sheet = buildBalanceSheet([
      { balance: 60_000 },
      { balance: -25_000 },
    ]);

    expect(sheet).toEqual({
      assets: 60_000,
      liabilities: 25_000,
      netWorth: 35_000,
    });
  });

  it("adds outstanding debt to liabilities", () => {
    const sheet = buildBalanceSheet([{ balance: 50_000 }], 80_000);

    expect(sheet).toEqual({
      assets: 50_000,
      liabilities: 80_000,
      netWorth: -30_000,
    });
  });

  it("ignores debt that has been overpaid", () => {
    const sheet = buildBalanceSheet([{ balance: 50_000 }], -5_000);

    expect(sheet.liabilities).toBe(0);
    expect(sheet.netWorth).toBe(50_000);
  });

  it("is empty with no positions", () => {
    expect(buildBalanceSheet([])).toEqual({
      assets: 0,
      liabilities: 0,
      netWorth: 0,
    });
  });
});

describe("buildNetWorthSeries", () => {
  it("carries the balance forward through days with no movement", () => {
    const series = buildNetWorthSeries({
      days,
      startingBalances: [{ id: "a", balance: 100_000 }],
      deltas: [{ accountId: "a", date: utc("2026-03-02"), amount: -20_000 }],
      startingDebt: 0,
      debtDeltas: [],
    });

    expect(series.map((point) => point.netWorth)).toEqual([
      100_000, 80_000, 80_000,
    ]);
  });

  it("produces a point for every day in the window", () => {
    const series = buildNetWorthSeries({
      days,
      startingBalances: [],
      deltas: [],
      startingDebt: 0,
      debtDeltas: [],
    });

    expect(series).toHaveLength(3);
    expect(series.map((point) => point.date)).toEqual(days);
  });

  it("keeps a transfer between accounts net worth neutral", () => {
    const series = buildNetWorthSeries({
      days,
      startingBalances: [
        { id: "a", balance: 100_000 },
        { id: "b", balance: 0 },
      ],
      deltas: [
        { accountId: "a", date: utc("2026-03-02"), amount: -40_000 },
        { accountId: "b", date: utc("2026-03-02"), amount: 40_000 },
      ],
      startingDebt: 0,
      debtDeltas: [],
    });

    expect(series.map((point) => point.netWorth)).toEqual([
      100_000, 100_000, 100_000,
    ]);
  });

  it("moves a spent-into card from assets to liabilities", () => {
    const series = buildNetWorthSeries({
      days,
      startingBalances: [{ id: "card", balance: 10_000 }],
      deltas: [{ accountId: "card", date: utc("2026-03-02"), amount: -30_000 }],
      startingDebt: 0,
      debtDeltas: [],
    });

    expect(series.at(0)).toMatchObject({ assets: 10_000, liabilities: 0 });
    expect(series.at(1)).toMatchObject({ assets: 0, liabilities: 20_000 });
  });

  it("clears debt as payments land", () => {
    const series = buildNetWorthSeries({
      days,
      startingBalances: [{ id: "a", balance: 200_000 }],
      deltas: [],
      startingDebt: 150_000,
      debtDeltas: [{ date: utc("2026-03-03"), amount: -50_000 }],
    });

    expect(series.map((point) => point.liabilities)).toEqual([
      150_000, 150_000, 100_000,
    ]);
    expect(series.at(2)?.netWorth).toBe(100_000);
  });

  it("takes on a new debt on the day it starts", () => {
    const series = buildNetWorthSeries({
      days,
      startingBalances: [],
      deltas: [],
      startingDebt: 0,
      debtDeltas: [{ date: utc("2026-03-02"), amount: 90_000 }],
    });

    expect(series.map((point) => point.netWorth)).toEqual([
      0, -90_000, -90_000,
    ]);
  });

  it("applies several movements on the same day", () => {
    const series = buildNetWorthSeries({
      days,
      startingBalances: [{ id: "a", balance: 0 }],
      deltas: [
        { accountId: "a", date: utc("2026-03-01"), amount: 50_000 },
        { accountId: "a", date: utc("2026-03-01"), amount: -20_000 },
      ],
      startingDebt: 0,
      debtDeltas: [],
    });

    expect(series.at(0)?.netWorth).toBe(30_000);
  });

  it("counts movement on an account missing from the opening balances", () => {
    const series = buildNetWorthSeries({
      days,
      startingBalances: [],
      deltas: [{ accountId: "ghost", date: utc("2026-03-01"), amount: 25_000 }],
      startingDebt: 0,
      debtDeltas: [],
    });

    expect(series.at(0)?.netWorth).toBe(25_000);
  });
});

describe("netWorthChange", () => {
  it("reports the absolute move across the window", () => {
    const series = buildNetWorthSeries({
      days,
      startingBalances: [{ id: "a", balance: 100_000 }],
      deltas: [{ accountId: "a", date: utc("2026-03-03"), amount: 25_000 }],
      startingDebt: 0,
      debtDeltas: [],
    });

    expect(netWorthChange(series)).toBe(25_000);
  });

  it("goes negative when net worth falls", () => {
    const series = buildNetWorthSeries({
      days,
      startingBalances: [{ id: "a", balance: 100_000 }],
      deltas: [{ accountId: "a", date: utc("2026-03-03"), amount: -25_000 }],
      startingDebt: 0,
      debtDeltas: [],
    });

    expect(netWorthChange(series)).toBe(-25_000);
  });

  it("is zero for an empty series", () => {
    expect(netWorthChange([])).toBe(0);
  });
});
