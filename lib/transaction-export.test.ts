import { describe, expect, it } from "vitest";

import {
  categoryLabel,
  transactionsCsvTable,
  type ExportableTransaction,
} from "@/lib/transaction-export";

const transaction = (
  overrides: Partial<ExportableTransaction> = {}
): ExportableTransaction => ({
  date: new Date(2026, 9, 18),
  payee: "Big Bazaar",
  category: "Groceries",
  account: "HDFC",
  amount: -1250.5,
  notes: null,
  transferId: null,
  splits: [],
  ...overrides,
});

describe("categoryLabel", () => {
  it("uses the category, or a placeholder when there is none", () => {
    expect(categoryLabel(transaction())).toBe("Groceries");
    expect(categoryLabel(transaction({ category: null }))).toBe(
      "Uncategorized"
    );
  });

  it("lists every category of a split", () => {
    expect(
      categoryLabel(
        transaction({
          category: null,
          splits: [{ category: "Groceries" }, { category: null }],
        })
      )
    ).toBe("Groceries / Uncategorized");
  });

  it("labels transfer legs", () => {
    expect(categoryLabel(transaction({ transferId: "t1" }))).toBe("Transfer");
  });
});

describe("transactionsCsvTable", () => {
  it("writes one row per transaction", () => {
    expect(transactionsCsvTable([transaction({ notes: "weekly" })])).toEqual({
      headers: ["Date", "Payee", "Category", "Account", "Amount", "Notes"],
      rows: [
        ["2026-10-18", "Big Bazaar", "Groceries", "HDFC", -1250.5, "weekly"],
      ],
    });
  });
});
