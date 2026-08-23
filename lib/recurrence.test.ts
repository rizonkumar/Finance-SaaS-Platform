import { describe, expect, it } from "vitest";

import { dateKeyUTC } from "@/lib/date-utc";
import {
  generatedTransactionId,
  nextOccurrence,
  occurrenceAt,
  planOccurrences,
  projectedBackfill,
  seekIndex,
  type PlannableTemplate,
  type RecurringTemplate,
} from "@/lib/recurrence";

const utc = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

const template = (overrides: Partial<RecurringTemplate> = {}) =>
  ({
    id: "rec_1",
    userId: "user_1",
    amount: -1000,
    payee: "Rent",
    notes: null,
    accountId: "acc_1",
    toAccountId: null,
    categoryId: null,
    frequency: "monthly",
    interval: 1,
    startDate: utc("2026-01-01"),
    endDate: null,
    lastGeneratedAt: null,
    isActive: true,
    createdAt: utc("2026-01-01"),
    updatedAt: utc("2026-01-01"),
    ...overrides,
  }) as RecurringTemplate;

const plannable = (
  overrides: Partial<PlannableTemplate> = {}
): PlannableTemplate => ({
  ...template(),
  accountName: "IDFC Savings",
  toAccountName: null,
  ...overrides,
});

const rule = (
  startDate: string,
  frequency: "daily" | "weekly" | "monthly" | "yearly",
  interval = 1
) => ({ startDate: utc(startDate), frequency, interval });

const keys = (
  startDate: string,
  frequency: "daily" | "weekly" | "monthly" | "yearly",
  count: number,
  interval = 1
) =>
  Array.from({ length: count }, (_, index) =>
    dateKeyUTC(occurrenceAt(rule(startDate, frequency, interval), index))
  );

describe("occurrenceAt", () => {
  it("walks days", () => {
    expect(keys("2026-01-01", "daily", 4)).toEqual([
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
      "2026-01-04",
    ]);
  });

  it("walks weeks", () => {
    expect(keys("2026-01-01", "weekly", 3)).toEqual([
      "2026-01-01",
      "2026-01-08",
      "2026-01-15",
    ]);
  });

  it("honours an interval greater than one", () => {
    expect(keys("2026-01-01", "daily", 3, 3)).toEqual([
      "2026-01-01",
      "2026-01-04",
      "2026-01-07",
    ]);
  });

  it("clamps month-end anchors without losing intent", () => {
    expect(keys("2026-01-31", "monthly", 5)).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
      "2026-04-30",
      "2026-05-31",
    ]);
  });

  it("restores a leap-day anchor on the next leap year", () => {
    expect(keys("2024-02-29", "yearly", 5)).toEqual([
      "2024-02-29",
      "2025-02-28",
      "2026-02-28",
      "2027-02-28",
      "2028-02-29",
    ]);
  });

  it("is strictly increasing", () => {
    const r = rule("2026-01-31", "monthly");
    for (let i = 1; i < 40; i++) {
      expect(occurrenceAt(r, i).getTime()).toBeGreaterThan(
        occurrenceAt(r, i - 1).getTime()
      );
    }
  });
});

describe("seekIndex", () => {
  it("starts at zero with no watermark", () => {
    expect(seekIndex(rule("2026-01-01", "monthly"), null)).toBe(0);
  });

  it("returns the first index strictly after the watermark", () => {
    const r = rule("2026-01-01", "monthly");
    expect(seekIndex(r, utc("2026-03-01"))).toBe(3);
    expect(dateKeyUTC(occurrenceAt(r, seekIndex(r, utc("2026-03-01"))))).toBe(
      "2026-04-01"
    );
  });

  it("returns zero when the watermark precedes the anchor", () => {
    expect(seekIndex(rule("2026-06-01", "daily"), utc("2026-01-01"))).toBe(0);
  });

  it("never skips an occurrence for month-end anchors", () => {
    const r = rule("2026-01-31", "monthly");
    for (let i = 0; i < 24; i++) {
      const occurrence = occurrenceAt(r, i);
      expect(seekIndex(r, occurrence)).toBe(i + 1);
    }
  });
});

describe("nextOccurrence", () => {
  it("returns null when paused", () => {
    expect(
      nextOccurrence(template({ isActive: false }), utc("2026-03-05"))
    ).toBeNull();
  });

  it("returns null past the end date", () => {
    expect(
      nextOccurrence(
        template({ endDate: utc("2026-02-01") }),
        utc("2026-03-05")
      )
    ).toBeNull();
  });

  it("returns the next future occurrence", () => {
    const result = nextOccurrence(template({}), utc("2026-03-05"));
    expect(result && dateKeyUTC(result)).toBe("2026-04-01");
  });
});

describe("projectedBackfill", () => {
  it("counts occurrences up to today", () => {
    expect(
      projectedBackfill(rule("2026-01-01", "monthly"), null, utc("2026-04-15"))
    ).toBe(4);
  });

  it("stops at the end date", () => {
    expect(
      projectedBackfill(
        rule("2026-01-01", "monthly"),
        utc("2026-02-15"),
        utc("2026-12-01")
      )
    ).toBe(2);
  });

  it("returns zero before the anchor", () => {
    expect(
      projectedBackfill(rule("2026-06-01", "daily"), null, utc("2026-01-01"))
    ).toBe(0);
  });
});

describe("generatedTransactionId", () => {
  it("is deterministic, which is what makes materialization idempotent", () => {
    const occurrence = occurrenceAt(rule("2026-01-31", "monthly"), 1);
    expect(generatedTransactionId("rec_1", occurrence)).toBe(
      "rt_rec_1_2026-02-28"
    );
    expect(generatedTransactionId("rec_1", occurrence)).toBe(
      generatedTransactionId("rec_1", occurrence)
    );
  });
});

describe("planOccurrences", () => {
  const sip = (overrides: Partial<PlannableTemplate> = {}) =>
    plannable({
      amount: 6_000_000,
      payee: "Groww SIP",
      toAccountId: "acc_groww",
      toAccountName: "Groww",
      ...overrides,
    });

  it("keeps a single-leg schedule to one row per occurrence", () => {
    const { rows } = planOccurrences([plannable()], utc("2026-03-15"));

    expect(rows).toHaveLength(3);
    expect(rows.every((row) => row.transferId === undefined)).toBe(true);
  });

  it("emits both legs of a transfer for every occurrence", () => {
    const { rows } = planOccurrences([sip()], utc("2026-03-15"));

    expect(rows).toHaveLength(6);
  });

  it("signs the legs in opposite directions on the right accounts", () => {
    const { rows } = planOccurrences([sip()], utc("2026-01-15"));
    const [outgoing, incoming] = rows;

    expect(outgoing).toMatchObject({
      accountId: "acc_1",
      amount: -6_000_000,
      payee: "Transfer to Groww",
    });
    expect(incoming).toMatchObject({
      accountId: "acc_groww",
      amount: 6_000_000,
      payee: "Transfer from IDFC Savings",
    });
  });

  it("links both legs with one shared transfer id", () => {
    const { rows } = planOccurrences([sip()], utc("2026-02-15"));
    const grouped = new Set(rows.map((row) => row.transferId));

    expect(rows).toHaveLength(4);
    expect(grouped.size).toBe(2);
    expect([...grouped].every(Boolean)).toBe(true);
  });

  it("derives stable ids so a second run inserts nothing new", () => {
    const first = planOccurrences([sip()], utc("2026-03-15"));
    const second = planOccurrences([sip()], utc("2026-03-15"));

    expect(first.rows.map((row) => row.id)).toEqual(
      second.rows.map((row) => row.id)
    );
    expect(new Set(first.rows.map((row) => row.id)).size).toBe(6);
  });

  it("never puts a category on a transfer leg", () => {
    const { rows } = planOccurrences(
      [sip({ categoryId: "cat_1" })],
      utc("2026-01-15")
    );

    expect(rows.every((row) => !row.categoryId)).toBe(true);
  });

  it("reports the latest occurrence as the watermark", () => {
    const { watermarks } = planOccurrences([sip()], utc("2026-03-15"));

    expect(watermarks).toEqual([{ id: "rec_1", date: occurrenceAt(sip(), 2) }]);
  });
});
