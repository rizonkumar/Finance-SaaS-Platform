import { describe, expect, it } from "vitest";

import {
  SPLIT_ERRORS,
  splitError,
  splitRemainder,
  toSplitLines,
} from "@/lib/splits";

const lines = (...amounts: number[]) => amounts.map((amount) => ({ amount }));

describe("splitError", () => {
  it("accepts splits that add up to the transaction", () => {
    expect(splitError(-1000, lines(-600, -400))).toBeNull();
  });

  it("needs at least two splits", () => {
    expect(splitError(-1000, lines(-1000))).toBe(SPLIT_ERRORS.tooFew);
  });

  it("rejects a split with no amount", () => {
    expect(splitError(-1000, lines(-1000, 0))).toBe(SPLIT_ERRORS.zeroAmount);
  });

  it("rejects splits that move money the other way", () => {
    expect(splitError(-1000, lines(-1200, 200))).toBe(SPLIT_ERRORS.mixedSigns);
  });

  it("rejects splits that do not add up", () => {
    expect(splitError(-1000, lines(-600, -300))).toBe(SPLIT_ERRORS.mismatch);
  });
});

describe("splitRemainder", () => {
  it("reports what is left to assign", () => {
    expect(splitRemainder(-1000, lines(-600))).toBe(-400);
  });
});

describe("toSplitLines", () => {
  it("gives every split the sign of the transaction, in miliunits", () => {
    expect(
      toSplitLines(-1000, [
        { categoryId: "food", amount: "0.6" },
        { amount: "-0.4" },
      ])
    ).toEqual([
      { categoryId: "food", amount: -600 },
      { categoryId: null, amount: -400 },
    ]);
  });

  it("treats a blank amount as zero", () => {
    expect(toSplitLines(500, [{ amount: "" }])).toEqual([
      { categoryId: null, amount: 0 },
    ]);
  });
});
