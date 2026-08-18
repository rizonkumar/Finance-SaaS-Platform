import { describe, expect, it } from "vitest";

import {
  calculatePercentageChange,
  convertAmountFromMiliunits,
  convertAmountToMiliunits,
  fillMissingDays,
} from "@/lib/utils";

describe("miliunits", () => {
  it("round-trips a value", () => {
    expect(
      convertAmountFromMiliunits(convertAmountToMiliunits(12.34))
    ).toBeCloseTo(12.34, 5);
  });

  it("rounds rather than truncates", () => {
    expect(convertAmountToMiliunits(0.0005)).toBe(1);
    expect(convertAmountToMiliunits(1.2345)).toBe(1235);
    expect(convertAmountToMiliunits(-1.2344)).toBe(-1234);
  });
});

describe("calculatePercentageChange", () => {
  it("returns zero when both sides are zero", () => {
    expect(calculatePercentageChange(0, 0)).toBe(0);
  });

  it("returns 100 when growing from zero", () => {
    expect(calculatePercentageChange(50, 0)).toBe(100);
  });

  it("computes a normal change", () => {
    expect(calculatePercentageChange(150, 100)).toBe(50);
    expect(calculatePercentageChange(50, 100)).toBe(-50);
  });
});

describe("fillMissingDays", () => {
  it("returns an empty array for no activity", () => {
    expect(
      fillMissingDays([], new Date("2026-01-01"), new Date("2026-01-05"))
    ).toEqual([]);
  });

  it("fills gaps with zeroes and keeps existing days", () => {
    const result = fillMissingDays(
      [{ date: new Date("2026-01-03"), income: 10, expenses: 4 }],
      new Date("2026-01-01"),
      new Date("2026-01-05")
    );

    expect(result).toHaveLength(5);
    expect(result[2]).toMatchObject({ income: 10, expenses: 4 });
    expect(result[0]).toMatchObject({ income: 0, expenses: 0 });
  });
});
