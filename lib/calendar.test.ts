import { describe, expect, it } from "vitest";

import {
  buildMonthGrid,
  isInMonth,
  monthParam,
  orderedWeekdays,
  parseMonthParam,
  shiftMonth,
} from "@/lib/calendar";
import { dateKeyUTC } from "@/lib/date-utc";

const today = new Date("2026-10-18T12:00:00.000Z");

describe("parseMonthParam", () => {
  it("reads a yyyy-MM value", () => {
    expect(parseMonthParam("2026-02", today)).toEqual({ year: 2026, month: 1 });
  });

  it("falls back to the current month for bad input", () => {
    expect(parseMonthParam("2026-13", today)).toEqual({
      year: 2026,
      month: 9,
    });
    expect(parseMonthParam(null, today)).toEqual({ year: 2026, month: 9 });
  });
});

describe("monthParam and shiftMonth", () => {
  it("round-trips across a year boundary", () => {
    const december = { year: 2025, month: 11 };

    expect(monthParam(shiftMonth(december, 1))).toBe("2026-01");
    expect(monthParam(shiftMonth({ year: 2026, month: 0 }, -1))).toBe(
      "2025-12"
    );
  });
});

describe("orderedWeekdays", () => {
  it("rotates the labels to the chosen first day", () => {
    expect(orderedWeekdays(1)[0]).toBe("Mon");
    expect(orderedWeekdays(0)[0]).toBe("Sun");
    expect(orderedWeekdays(1)[6]).toBe("Sun");
  });
});

describe("buildMonthGrid", () => {
  const october = { year: 2026, month: 9 };

  it("starts on the chosen weekday and covers the whole month", () => {
    const weeks = buildMonthGrid(october, 1);
    const days = weeks.flat();

    expect(dateKeyUTC(days[0] as Date)).toBe("2026-09-28");
    expect(dateKeyUTC(days.at(-1) as Date)).toBe("2026-11-01");
    expect(weeks.every((week) => week.length === 7)).toBe(true);
  });

  it("starts on Sunday when asked", () => {
    const [firstWeek] = buildMonthGrid(october, 0);

    expect(dateKeyUTC(firstWeek?.[0] as Date)).toBe("2026-09-27");
  });

  it("marks which days belong to the month", () => {
    const days = buildMonthGrid(october, 1).flat();

    expect(days.filter((day) => isInMonth(day, october))).toHaveLength(31);
  });
});
