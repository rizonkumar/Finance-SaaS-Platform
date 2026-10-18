import { describe, expect, it } from "vitest";

import { csvFilename, escapeCsvCell, toCsv } from "@/lib/csv-export";

describe("escapeCsvCell", () => {
  it("leaves plain values alone", () => {
    expect(escapeCsvCell("Groceries")).toBe("Groceries");
    expect(escapeCsvCell(-12.5)).toBe("-12.5");
  });

  it("renders empty cells for missing values", () => {
    expect(escapeCsvCell(null)).toBe("");
    expect(escapeCsvCell(undefined)).toBe("");
  });

  it("quotes commas, quotes and line breaks", () => {
    expect(escapeCsvCell('Say "hi", then\nleave')).toBe(
      '"Say ""hi"", then\nleave"'
    );
  });

  it("neutralises text that a spreadsheet would run as a formula", () => {
    expect(escapeCsvCell("=SUM(A1:A2)")).toBe("'=SUM(A1:A2)");
    expect(escapeCsvCell("@cmd")).toBe("'@cmd");
  });
});

describe("toCsv", () => {
  it("joins headers and rows with CRLF", () => {
    expect(
      toCsv({
        headers: ["Payee", "Amount"],
        rows: [
          ["Rent", -1000],
          ["Salary", 5000],
        ],
      })
    ).toBe("Payee,Amount\r\nRent,-1000\r\nSalary,5000");
  });
});

describe("csvFilename", () => {
  it("stamps the file with the export date", () => {
    expect(
      csvFilename("transactions", new Date("2026-10-18T09:00:00.000Z"))
    ).toBe("transactions-2026-10-18.csv");
  });
});
