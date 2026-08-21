import { describe, expect, it } from "vitest";

import { dateKeyUTC, eachDayUTC, parseDayUTC } from "@/lib/date-utc";

describe("parseDayUTC", () => {
  it("reads a yyyy-MM-dd string as a UTC day", () => {
    expect(dateKeyUTC(parseDayUTC("2026-03-09"))).toBe("2026-03-09");
  });

  it("lands at noon so a timezone shift cannot move the day", () => {
    expect(parseDayUTC("2026-03-09").toISOString()).toBe(
      "2026-03-09T12:00:00.000Z"
    );
  });

  it("handles the first day of a year", () => {
    expect(dateKeyUTC(parseDayUTC("2026-01-01"))).toBe("2026-01-01");
  });
});

describe("eachDayUTC", () => {
  const from = parseDayUTC("2026-03-01");

  it("includes both ends of the range", () => {
    const days = eachDayUTC(from, parseDayUTC("2026-03-04"), 100);

    expect(days.map(dateKeyUTC)).toEqual([
      "2026-03-01",
      "2026-03-02",
      "2026-03-03",
      "2026-03-04",
    ]);
  });

  it("returns a single day when both ends match", () => {
    expect(eachDayUTC(from, from, 100)).toHaveLength(1);
  });

  it("is empty when the range runs backwards", () => {
    expect(eachDayUTC(from, parseDayUTC("2026-02-25"), 100)).toEqual([]);
  });

  it("stops at the limit", () => {
    expect(eachDayUTC(from, parseDayUTC("2026-12-31"), 5)).toHaveLength(5);
  });

  it("crosses a month boundary", () => {
    const days = eachDayUTC(
      parseDayUTC("2026-01-30"),
      parseDayUTC("2026-02-02"),
      100
    );

    expect(days.map(dateKeyUTC)).toEqual([
      "2026-01-30",
      "2026-01-31",
      "2026-02-01",
      "2026-02-02",
    ]);
  });
});
