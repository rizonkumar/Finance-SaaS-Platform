import { endOfDayUTC, startOfDayUTC } from "@/lib/date-utc";

export type GoalStatus =
  "completed" | "ahead" | "on-track" | "behind" | "no-deadline";

export const PACE_TOLERANCE = 5;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_PER_MONTH = 365.25 / 12;

export type GoalTimeline = {
  startDate: Date;
  targetDate: Date | null;
};

export function goalPercentage(saved: number, target: number): number {
  if (target <= 0) return 0;

  return (saved / target) * 100;
}

export function daysRemaining(
  timeline: GoalTimeline,
  today: Date = new Date()
): number | null {
  if (!timeline.targetDate) return null;

  const deadline = startOfDayUTC(timeline.targetDate).getTime();
  const now = startOfDayUTC(today).getTime();

  return Math.round((deadline - now) / MS_PER_DAY);
}

/**
 * The share of the goal that should already be funded if contributions were
 * spread evenly between the start date and the deadline. This is the yardstick
 * the status is measured against, not the raw percentage.
 */
export function expectedPercentage(
  timeline: GoalTimeline,
  today: Date = new Date()
): number | null {
  if (!timeline.targetDate) return null;

  const start = startOfDayUTC(timeline.startDate).getTime();
  const end = endOfDayUTC(timeline.targetDate).getTime();
  const now = today.getTime();

  if (end <= start) return now >= end ? 100 : 0;
  if (now <= start) return 0;
  if (now >= end) return 100;

  return ((now - start) / (end - start)) * 100;
}

export function requiredPerMonth(
  saved: number,
  target: number,
  timeline: GoalTimeline,
  today: Date = new Date()
): number | null {
  const remaining = target - saved;

  if (remaining <= 0) return 0;
  if (!timeline.targetDate) return null;

  const days = daysRemaining(timeline, today) ?? 0;

  if (days <= 0) return remaining;

  return remaining / Math.max(days / DAYS_PER_MONTH, 1);
}

export function averagePerMonth(
  saved: number,
  timeline: GoalTimeline,
  today: Date = new Date()
): number {
  if (saved <= 0) return 0;

  const elapsedDays =
    (today.getTime() - startOfDayUTC(timeline.startDate).getTime()) /
    MS_PER_DAY;

  return saved / Math.max(elapsedDays / DAYS_PER_MONTH, 1);
}

export function projectedCompletion(
  saved: number,
  target: number,
  timeline: GoalTimeline,
  today: Date = new Date()
): Date | null {
  if (saved >= target) return today;

  const perMonth = averagePerMonth(saved, timeline, today);

  if (perMonth <= 0) return null;

  const monthsLeft = (target - saved) / perMonth;

  return new Date(today.getTime() + monthsLeft * DAYS_PER_MONTH * MS_PER_DAY);
}

export function goalStatus(
  saved: number,
  target: number,
  timeline: GoalTimeline,
  today: Date = new Date()
): GoalStatus {
  if (target > 0 && saved >= target) return "completed";
  if (!timeline.targetDate) return "no-deadline";

  const actual = goalPercentage(saved, target);
  const expected = expectedPercentage(timeline, today) ?? 0;

  if (actual >= expected + PACE_TOLERANCE) return "ahead";
  if (actual < expected - PACE_TOLERANCE) return "behind";

  return "on-track";
}
