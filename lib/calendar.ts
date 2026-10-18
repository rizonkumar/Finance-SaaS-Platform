import {
  addDaysUTC,
  addMonthsUTC,
  daysInMonthUTC,
  startOfWeekUTC,
  utcNoon,
} from "@/lib/date-utc";

export const WEEK_START_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
] as const;

export type WeekStart = (typeof WEEK_START_OPTIONS)[number]["value"];

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

export type CalendarMonth = {
  year: number;
  month: number;
};

export const currentMonth = (today: Date = new Date()): CalendarMonth => ({
  year: today.getUTCFullYear(),
  month: today.getUTCMonth(),
});

export function parseMonthParam(
  value: string | null,
  today: Date = new Date()
): CalendarMonth {
  const match = value ? MONTH_PATTERN.exec(value) : null;
  const month = Number(match?.[2]) - 1;

  if (!match || month < 0 || month > 11) return currentMonth(today);

  return { year: Number(match[1]), month };
}

export const monthParam = ({ year, month }: CalendarMonth) =>
  `${year}-${String(month + 1).padStart(2, "0")}`;

export const firstOfMonth = ({ year, month }: CalendarMonth) =>
  utcNoon(year, month, 1);

export const lastOfMonth = ({ year, month }: CalendarMonth) =>
  utcNoon(year, month, daysInMonthUTC(year, month));

export const shiftMonth = (value: CalendarMonth, delta: number) =>
  currentMonth(addMonthsUTC(firstOfMonth(value), delta));

export const isInMonth = (date: Date, { year, month }: CalendarMonth) =>
  date.getUTCFullYear() === year && date.getUTCMonth() === month;

export const orderedWeekdays = (weekStartsOn: number) =>
  WEEKDAY_LABELS.map(
    (_label, index) => WEEKDAY_LABELS[(index + weekStartsOn) % 7] ?? ""
  );

export function buildMonthGrid(
  value: CalendarMonth,
  weekStartsOn: number
): Date[][] {
  const last = lastOfMonth(value);
  const weeks: Date[][] = [];

  let cursor = startOfWeekUTC(firstOfMonth(value), weekStartsOn);

  while (cursor <= last) {
    const weekStart = cursor;

    weeks.push(
      Array.from({ length: 7 }, (_day, index) => addDaysUTC(weekStart, index))
    );
    cursor = addDaysUTC(cursor, 7);
  }

  return weeks;
}
