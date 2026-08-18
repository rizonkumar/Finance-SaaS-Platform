import { describe, expect, it } from "vitest";

import {
  budgetPercentage,
  budgetStatus,
  isBudgetActiveNow,
  resolveBudgetPeriod,
} from "@/lib/budgets";

const utc = (iso: string) => new Date(`${iso}T12:00:00.000Z`);
const iso = (date: Date) => date.toISOString();

describe("resolveBudgetPeriod", () => {
  const base = { startDate: utc("2026-01-01"), endDate: null };

  it("resolves the calendar month", () => {
    const { periodStart, periodEnd } = resolveBudgetPeriod(
      { ...base, period: "monthly" },
      utc("2026-02-14")
    );
    expect(iso(periodStart)).toBe("2026-02-01T00:00:00.000Z");
    expect(iso(periodEnd)).toBe("2026-02-28T23:59:59.999Z");
  });

  it("handles a leap February", () => {
    const { periodEnd } = resolveBudgetPeriod(
      { ...base, period: "monthly" },
      utc("2024-02-10")
    );
    expect(iso(periodEnd)).toBe("2024-02-29T23:59:59.999Z");
  });

  it("resolves the ISO week from Monday to Sunday", () => {
    const { periodStart, periodEnd } = resolveBudgetPeriod(
      { ...base, period: "weekly" },
      utc("2026-08-13")
    );
    expect(iso(periodStart)).toBe("2026-08-10T00:00:00.000Z");
    expect(iso(periodEnd)).toBe("2026-08-16T23:59:59.999Z");
  });

  it("treats Sunday as the end of the current ISO week", () => {
    const { periodStart, periodEnd } = resolveBudgetPeriod(
      { ...base, period: "weekly" },
      utc("2026-08-16")
    );
    expect(iso(periodStart)).toBe("2026-08-10T00:00:00.000Z");
    expect(iso(periodEnd)).toBe("2026-08-16T23:59:59.999Z");
  });

  it("resolves the calendar year", () => {
    const { periodStart, periodEnd } = resolveBudgetPeriod(
      { ...base, period: "yearly" },
      utc("2026-08-13")
    );
    expect(iso(periodStart)).toBe("2026-01-01T00:00:00.000Z");
    expect(iso(periodEnd)).toBe("2026-12-31T23:59:59.999Z");
  });

  it("uses the explicit range for a custom period", () => {
    const { periodStart, periodEnd } = resolveBudgetPeriod(
      {
        period: "custom",
        startDate: utc("2026-03-05"),
        endDate: utc("2026-04-09"),
      },
      utc("2026-03-20")
    );
    expect(iso(periodStart)).toBe("2026-03-05T00:00:00.000Z");
    expect(iso(periodEnd)).toBe("2026-04-09T23:59:59.999Z");
  });
});

describe("isBudgetActiveNow", () => {
  it("is inactive before the start date", () => {
    expect(
      isBudgetActiveNow(
        { period: "monthly", startDate: utc("2026-05-01"), endDate: null },
        utc("2026-04-01")
      )
    ).toBe(false);
  });

  it("is inactive after the end date", () => {
    expect(
      isBudgetActiveNow(
        {
          period: "monthly",
          startDate: utc("2026-01-01"),
          endDate: utc("2026-03-31"),
        },
        utc("2026-04-01")
      )
    ).toBe(false);
  });

  it("is active inside the range", () => {
    expect(
      isBudgetActiveNow(
        {
          period: "monthly",
          startDate: utc("2026-01-01"),
          endDate: utc("2026-12-31"),
        },
        utc("2026-06-01")
      )
    ).toBe(true);
  });
});

describe("budgetPercentage and budgetStatus", () => {
  it("guards a zero budget instead of dividing by zero", () => {
    expect(budgetPercentage(5000, 0)).toBe(0);
    expect(budgetStatus(budgetPercentage(5000, 0))).toBe("on-track");
  });

  it("classifies each band", () => {
    expect(budgetStatus(budgetPercentage(50, 100))).toBe("on-track");
    expect(budgetStatus(budgetPercentage(74, 100))).toBe("on-track");
    expect(budgetStatus(budgetPercentage(75, 100))).toBe("warning");
    expect(budgetStatus(budgetPercentage(100, 100))).toBe("warning");
    expect(budgetStatus(budgetPercentage(101, 100))).toBe("over");
  });
});
