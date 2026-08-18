import { describe, expect, it } from "vitest";

import {
  assignColumn,
  countMappedColumns,
  mapImportedRows,
} from "@/lib/csv-import";

describe("assignColumn", () => {
  it("assigns a column", () => {
    expect(assignColumn({}, 0, "amount")).toEqual({ column_0: "amount" });
  });

  it("clears a previous column holding the same value", () => {
    const result = assignColumn({ column_0: "amount" }, 2, "amount");
    expect(result.column_0).toBeNull();
    expect(result.column_2).toBe("amount");
  });

  it("treats skip as an unmapped column", () => {
    expect(assignColumn({}, 1, "skip").column_1).toBeNull();
  });

  it("does not mutate its input", () => {
    const original = { column_0: "amount" };
    assignColumn(original, 1, "amount");
    expect(original).toEqual({ column_0: "amount" });
  });
});

describe("countMappedColumns", () => {
  it("counts only mapped columns", () => {
    expect(
      countMappedColumns({
        column_0: "amount",
        column_1: null,
        column_2: "date",
      })
    ).toBe(2);
  });
});

describe("mapImportedRows", () => {
  const headers = ["Amount", "When", "Who"];
  const selected = { column_0: "amount", column_1: "date", column_2: "payee" };

  it("maps rows to transactions in miliunits", () => {
    const result = mapImportedRows(
      headers,
      [["12.50", "2026-01-05 00:00:00", "Coffee"]],
      selected
    );

    expect(result).toEqual([
      { amount: 12500, date: "2026-01-05", payee: "Coffee" },
    ]);
  });

  it("drops rows with no mapped values", () => {
    const result = mapImportedRows(headers, [[]], selected);
    expect(result).toEqual([]);
  });

  it("ignores unmapped columns", () => {
    const result = mapImportedRows(
      headers,
      [["12.50", "2026-01-05 00:00:00", "Coffee"]],
      { column_0: "amount", column_1: "date", column_2: null }
    );

    expect(result[0]).not.toHaveProperty("payee", "Coffee");
  });
});
