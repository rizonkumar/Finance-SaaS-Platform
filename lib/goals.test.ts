import { describe, expect, it } from "vitest";

import {
  averagePerMonth,
  daysRemaining,
  expectedPercentage,
  goalPercentage,
  goalStatus,
  projectedCompletion,
  requiredPerMonth,
} from "@/lib/goals";

const utc = (iso: string) => new Date(`${iso}T12:00:00.000Z`);

const timeline = {
  startDate: utc("2026-01-01"),
  targetDate: utc("2026-12-31"),
};

const openEnded = { startDate: utc("2026-01-01"), targetDate: null };

describe("goalPercentage", () => {
  it("reports the funded share", () => {
    expect(goalPercentage(2500, 10000)).toBe(25);
  });

  it("can exceed the target", () => {
    expect(goalPercentage(12000, 10000)).toBe(120);
  });

  it("guards against a non-positive target", () => {
    expect(goalPercentage(500, 0)).toBe(0);
  });
});

describe("daysRemaining", () => {
  it("counts whole days to the deadline", () => {
    expect(daysRemaining(timeline, utc("2026-12-21"))).toBe(10);
  });

  it("is zero on the deadline itself", () => {
    expect(daysRemaining(timeline, utc("2026-12-31"))).toBe(0);
  });

  it("goes negative once the deadline has passed", () => {
    expect(daysRemaining(timeline, utc("2027-01-10"))).toBe(-10);
  });

  it("is null without a deadline", () => {
    expect(daysRemaining(openEnded, utc("2026-06-01"))).toBeNull();
  });
});

describe("expectedPercentage", () => {
  it("is zero before the goal starts", () => {
    expect(expectedPercentage(timeline, utc("2025-12-01"))).toBe(0);
  });

  it("is roughly half way through the window", () => {
    expect(expectedPercentage(timeline, utc("2026-07-01"))).toBeCloseTo(50, 0);
  });

  it("caps at 100 after the deadline", () => {
    expect(expectedPercentage(timeline, utc("2027-03-01"))).toBe(100);
  });

  it("is null without a deadline", () => {
    expect(expectedPercentage(openEnded, utc("2026-06-01"))).toBeNull();
  });

  it("treats a same-day deadline as a one-day window", () => {
    const sameDay = {
      startDate: utc("2026-01-01"),
      targetDate: utc("2026-01-01"),
    };
    expect(expectedPercentage(sameDay, utc("2026-01-01"))).toBeCloseTo(50, 4);
    expect(expectedPercentage(sameDay, utc("2026-01-02"))).toBe(100);
  });

  it("does not divide by a negative window when the deadline precedes the start", () => {
    const inverted = {
      startDate: utc("2026-06-01"),
      targetDate: utc("2026-01-01"),
    };
    expect(expectedPercentage(inverted, utc("2026-03-01"))).toBe(100);
    expect(expectedPercentage(inverted, utc("2025-06-01"))).toBe(0);
  });
});

describe("requiredPerMonth", () => {
  it("spreads the remainder over the months left", () => {
    // Six months to go on a 6,000 shortfall lands near 1,000 a month.
    expect(
      requiredPerMonth(4000, 10000, timeline, utc("2026-07-01"))
    ).toBeCloseTo(1000, -2);
  });

  it("is zero once the target is met", () => {
    expect(requiredPerMonth(10000, 10000, timeline, utc("2026-07-01"))).toBe(0);
  });

  it("returns the whole remainder after the deadline", () => {
    expect(requiredPerMonth(4000, 10000, timeline, utc("2027-02-01"))).toBe(
      6000
    );
  });

  it("does not inflate the instalment inside the final month", () => {
    // Ten days left must not scale the shortfall up by 3x.
    expect(requiredPerMonth(4000, 10000, timeline, utc("2026-12-21"))).toBe(
      6000
    );
  });

  it("is null without a deadline while funds are still short", () => {
    expect(
      requiredPerMonth(4000, 10000, openEnded, utc("2026-07-01"))
    ).toBeNull();
  });
});

describe("averagePerMonth", () => {
  it("averages over the months elapsed", () => {
    expect(averagePerMonth(6000, timeline, utc("2026-07-01"))).toBeCloseTo(
      1000,
      -2
    );
  });

  it("is zero with nothing saved", () => {
    expect(averagePerMonth(0, timeline, utc("2026-07-01"))).toBe(0);
  });

  it("does not divide by a sub-month window", () => {
    // Two days in, a 500 deposit is a 500/month pace, not 7,500.
    expect(averagePerMonth(500, timeline, utc("2026-01-03"))).toBe(500);
  });
});

describe("projectedCompletion", () => {
  it("extrapolates the pace so far", () => {
    const projected = projectedCompletion(
      6000,
      12000,
      timeline,
      utc("2026-07-01")
    );
    // Half saved in six months projects the finish six months out.
    expect(projected?.toISOString().slice(0, 7)).toBe("2026-12");
  });

  it("is null when nothing has been saved", () => {
    expect(
      projectedCompletion(0, 10000, timeline, utc("2026-07-01"))
    ).toBeNull();
  });

  it("is today once the target is reached", () => {
    const today = utc("2026-07-01");
    expect(projectedCompletion(10000, 10000, timeline, today)).toEqual(today);
  });
});

describe("goalStatus", () => {
  it("is completed at or past the target", () => {
    expect(goalStatus(10000, 10000, timeline, utc("2026-07-01"))).toBe(
      "completed"
    );
  });

  it("is no-deadline for an open-ended goal", () => {
    expect(goalStatus(1000, 10000, openEnded, utc("2026-07-01"))).toBe(
      "no-deadline"
    );
  });

  it("is on-track within the pace tolerance", () => {
    expect(goalStatus(5000, 10000, timeline, utc("2026-07-01"))).toBe(
      "on-track"
    );
  });

  it("is ahead when funding outpaces the clock", () => {
    expect(goalStatus(9000, 10000, timeline, utc("2026-07-01"))).toBe("ahead");
  });

  it("is behind when funding trails the clock", () => {
    expect(goalStatus(1000, 10000, timeline, utc("2026-07-01"))).toBe("behind");
  });

  it("is behind on an unfunded goal past its deadline", () => {
    expect(goalStatus(9000, 10000, timeline, utc("2027-01-05"))).toBe("behind");
  });
});
