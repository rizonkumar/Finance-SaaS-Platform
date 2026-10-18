import { describe, expect, it } from "vitest";

import {
  applyCategoryRules,
  categorize,
  matchesRule,
  rankRules,
  type CategoryRule,
} from "@/lib/category-rules";

const rule = (overrides: Partial<CategoryRule>): CategoryRule => ({
  pattern: "swiggy",
  match: "contains",
  categoryId: "food",
  priority: 0,
  ...overrides,
});

describe("matchesRule", () => {
  it("matches a substring regardless of case and padding", () => {
    expect(matchesRule("  UPI/SWIGGY*Order ", rule({}))).toBe(true);
  });

  it("matches only the start of the payee for starts_with", () => {
    const startsWith = rule({ pattern: "amazon", match: "starts_with" });

    expect(matchesRule("Amazon Pay", startsWith)).toBe(true);
    expect(matchesRule("Pay Amazon", startsWith)).toBe(false);
  });

  it("requires the whole payee for equals", () => {
    const equals = rule({ pattern: "rent", match: "equals" });

    expect(matchesRule("Rent", equals)).toBe(true);
    expect(matchesRule("Rental car", equals)).toBe(false);
  });

  it("never matches an empty pattern", () => {
    expect(matchesRule("anything", rule({ pattern: "   " }))).toBe(false);
  });
});

describe("rankRules", () => {
  it("orders by priority, then by the more specific pattern", () => {
    const ranked = rankRules([
      rule({ pattern: "uber", categoryId: "a" }),
      rule({ pattern: "uber eats", categoryId: "b" }),
      rule({ pattern: "x", categoryId: "c", priority: 5 }),
    ]);

    expect(ranked.map((item) => item.categoryId)).toEqual(["c", "b", "a"]);
  });
});

describe("categorize", () => {
  const rules = [
    rule({ pattern: "uber", categoryId: "transport" }),
    rule({ pattern: "uber eats", categoryId: "food" }),
  ];

  it("prefers the most specific matching rule", () => {
    expect(categorize("Uber Eats India", rules)).toBe("food");
    expect(categorize("Uber Trip", rules)).toBe("transport");
  });

  it("returns null when nothing matches", () => {
    expect(categorize("Electricity board", rules)).toBeNull();
  });
});

describe("applyCategoryRules", () => {
  it("fills only rows that have no category yet", () => {
    const rows = applyCategoryRules(
      [
        { payee: "Swiggy", categoryId: null },
        { payee: "Swiggy", categoryId: "manual" },
        { payee: "Landlord" },
      ],
      [rule({})]
    );

    expect(rows.map((row) => row.categoryId)).toEqual([
      "food",
      "manual",
      undefined,
    ]);
  });

  it("returns the same rows when there are no rules", () => {
    const rows = [{ payee: "Swiggy" }];

    expect(applyCategoryRules(rows, [])).toBe(rows);
  });
});
