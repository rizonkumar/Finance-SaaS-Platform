import { describe, expect, it } from "vitest";

import {
  buildCategoryTrend,
  buildMonthlyFlow,
  monthsBetween,
  OTHER_LABEL,
  reportCsvTable,
  savingsRate,
  summarizeFlow,
  UNCATEGORIZED_LABEL,
  type ReportLine,
} from "@/lib/reports";

const utc = (iso: string) => new Date(`${iso}T12:00:00.000Z`);

const line = (
  date: string,
  category: string | null,
  expenses: number,
  income = 0
): ReportLine => ({ date: utc(date), category, income, expenses });

describe("monthsBetween", () => {
  it("lists every month the range touches", () => {
    expect(monthsBetween(utc("2025-11-20"), utc("2026-02-03"))).toEqual([
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
    ]);
  });

  it("returns a single month for a short range", () => {
    expect(monthsBetween(utc("2026-03-01"), utc("2026-03-31"))).toEqual([
      "2026-03",
    ]);
  });
});

describe("savingsRate", () => {
  it("is the share of income not spent", () => {
    expect(savingsRate(1000, 750)).toBe(25);
  });

  it("is zero without income", () => {
    expect(savingsRate(0, 300)).toBe(0);
  });
});

describe("buildMonthlyFlow", () => {
  it("buckets lines by month and fills empty months", () => {
    const flow = buildMonthlyFlow(
      [
        line("2026-01-05", "Food", 100, 0),
        line("2026-01-20", null, 0, 1000),
        line("2026-03-02", "Food", 50),
      ],
      ["2026-01", "2026-02", "2026-03"]
    );

    expect(flow).toEqual([
      { month: "2026-01", income: 1000, expenses: 100, net: 900 },
      { month: "2026-02", income: 0, expenses: 0, net: 0 },
      { month: "2026-03", income: 0, expenses: 50, net: -50 },
    ]);
  });

  it("ignores lines outside the months", () => {
    expect(
      buildMonthlyFlow([line("2025-12-31", "Food", 100)], ["2026-01"])
    ).toEqual([{ month: "2026-01", income: 0, expenses: 0, net: 0 }]);
  });
});

describe("summarizeFlow", () => {
  it("totals the months and derives the savings rate", () => {
    expect(
      summarizeFlow([
        { month: "2026-01", income: 1000, expenses: 400, net: 600 },
        { month: "2026-02", income: 1000, expenses: 600, net: 400 },
      ])
    ).toEqual({ income: 2000, expenses: 1000, net: 1000, savingsRate: 50 });
  });
});

describe("buildCategoryTrend", () => {
  const months = ["2026-01", "2026-02"];

  it("ranks categories by spend with a value per month", () => {
    const trend = buildCategoryTrend(
      [
        line("2026-01-03", "Food", 100),
        line("2026-02-03", "Food", 50),
        line("2026-02-10", "Rent", 500),
        line("2026-02-11", null, 20),
        line("2026-02-12", "Salary", 0, 900),
      ],
      months
    );

    expect(trend).toEqual([
      { category: "Rent", total: 500, values: [0, 500] },
      { category: "Food", total: 150, values: [100, 50] },
      { category: UNCATEGORIZED_LABEL, total: 20, values: [0, 20] },
    ]);
  });

  it("folds the long tail into Other", () => {
    const trend = buildCategoryTrend(
      [
        line("2026-01-01", "A", 300),
        line("2026-01-01", "B", 200),
        line("2026-02-01", "C", 100),
      ],
      months,
      1
    );

    expect(trend).toEqual([
      { category: "A", total: 300, values: [300, 0] },
      { category: OTHER_LABEL, total: 300, values: [200, 100] },
    ]);
  });
});

describe("reportCsvTable", () => {
  it("puts the flow rows first, then one row per category", () => {
    const table = reportCsvTable({
      months: ["2026-01", "2026-02"],
      monthly: [
        { month: "2026-01", income: 100, expenses: 40, net: 60 },
        { month: "2026-02", income: 50, expenses: 70, net: -20 },
      ],
      categories: [{ category: "Food", total: 110, values: [40, 70] }],
    });

    expect(table.headers).toEqual(["", "2026-01", "2026-02", "Total"]);
    expect(table.rows).toEqual([
      ["Income", 100, 50, 150],
      ["Spending", 40, 70, 110],
      ["Net", 60, -20, 40],
      ["Food", 40, 70, 110],
    ]);
  });
});
