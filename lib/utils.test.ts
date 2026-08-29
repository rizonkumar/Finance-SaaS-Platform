import { describe, expect, it } from "vitest";

import {
  calculatePercentageChange,
  convertAmountFromMiliunits,
  convertAmountToMiliunits,
  fillMissingDays,
  formatCadence,
  formatMonths,
  signedAmount,
  unsignedAmount,
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

describe("formatMonths", () => {
  it("stays in months under a year", () => {
    expect(formatMonths(8)).toBe("8 mo");
  });

  it("drops the months on a whole number of years", () => {
    expect(formatMonths(24)).toBe("2 yr");
  });

  it("reads out both parts", () => {
    expect(formatMonths(27)).toBe("2 yr 3 mo");
  });

  it("rounds a part month up", () => {
    expect(formatMonths(11.2)).toBe("1 yr");
  });

  it("floors at zero", () => {
    expect(formatMonths(-3)).toBe("0 mo");
  });
});

describe("signedAmount", () => {
  it("applies the debit sign to a bare magnitude", () => {
    expect(signedAmount("499", -1)).toBe("-499");
  });

  it("leaves a credit magnitude bare", () => {
    expect(signedAmount("499", 1)).toBe("499");
  });

  it("keeps a half-typed decimal intact, so the caret never jumps", () => {
    expect(signedAmount("499.", -1)).toBe("-499.");
    expect(signedAmount("0.0", -1)).toBe("-0.0");
  });

  it("never doubles a sign that is already there", () => {
    expect(signedAmount("-499", -1)).toBe("-499");
    expect(signedAmount("-499", 1)).toBe("499");
  });

  it("passes an empty value straight through", () => {
    expect(signedAmount("", -1)).toBe("");
    expect(signedAmount(undefined, -1)).toBeUndefined();
  });
});

describe("unsignedAmount", () => {
  it("strips the sign for display without reparsing the number", () => {
    expect(unsignedAmount("-499.50")).toBe("499.50");
    expect(unsignedAmount("499.50")).toBe("499.50");
    expect(unsignedAmount("")).toBe("");
  });

  it("round-trips with signedAmount", () => {
    expect(signedAmount(unsignedAmount("-12000"), -1)).toBe("-12000");
  });
});

describe("formatCadence", () => {
  it("reads naturally at an interval of one", () => {
    expect(formatCadence({ frequency: "monthly", interval: 1 })).toBe(
      "Every month"
    );
  });

  it("pluralises a wider interval", () => {
    expect(formatCadence({ frequency: "weekly", interval: 2 })).toBe(
      "Every 2 weeks"
    );
  });
});
