import { describe, expect, it } from "vitest";

import {
  duplicateKey,
  findDuplicateIndexes,
  withoutIndexes,
} from "@/lib/duplicates";

const row = (payee: string, amount = -500, date = "2026-03-01") => ({
  date,
  amount,
  payee,
});

describe("duplicateKey", () => {
  it("ignores case and repeated whitespace in the payee", () => {
    expect(duplicateKey(row("  Big   Bazaar "))).toBe(
      duplicateKey(row("big bazaar"))
    );
  });
});

describe("findDuplicateIndexes", () => {
  it("flags rows that already exist", () => {
    const existing = [row("Netflix")];
    const candidates = [row("Netflix"), row("Spotify")];

    expect(findDuplicateIndexes(candidates, existing)).toEqual([0]);
  });

  it("matches one existing row to one candidate only", () => {
    const existing = [row("Coffee")];
    const candidates = [row("Coffee"), row("Coffee")];

    expect(findDuplicateIndexes(candidates, existing)).toEqual([0]);
  });

  it("treats a different amount or a distant date as a new transaction", () => {
    const existing = [row("Coffee")];
    const candidates = [row("Coffee", -600), row("Coffee", -500, "2026-03-03")];

    expect(findDuplicateIndexes(candidates, existing)).toEqual([]);
  });

  it("tolerates a one day shift from time zones", () => {
    const existing = [row("Coffee", -500, "2026-02-28")];

    expect(findDuplicateIndexes([row("Coffee")], existing)).toEqual([0]);
  });

  it("pairs each candidate with the closest existing day", () => {
    const existing = [
      row("Coffee", -500, "2026-03-02"),
      row("Coffee", -500, "2026-03-01"),
    ];
    const candidates = [row("Coffee"), row("Coffee", -500, "2026-03-03")];

    expect(findDuplicateIndexes(candidates, existing)).toEqual([0, 1]);
  });

  it("does not flag repeats inside the file itself", () => {
    expect(findDuplicateIndexes([row("Tea"), row("Tea")], [])).toEqual([]);
  });
});

describe("withoutIndexes", () => {
  it("drops the given positions", () => {
    expect(withoutIndexes(["a", "b", "c"], [0, 2])).toEqual(["b"]);
  });
});
