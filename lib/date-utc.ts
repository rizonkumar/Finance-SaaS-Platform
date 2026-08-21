export const utcNoon = (year: number, month: number, day: number) =>
  new Date(Date.UTC(year, month, day, 12, 0, 0, 0));

export const toUtcNoon = (date: Date) =>
  utcNoon(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

export const addDaysUTC = (date: Date, days: number) =>
  utcNoon(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days);

export const daysInMonthUTC = (year: number, month: number) =>
  new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

export const addMonthsUTC = (date: Date, months: number) => {
  const total = date.getUTCMonth() + months;
  const year = date.getUTCFullYear() + Math.floor(total / 12);
  const month = ((total % 12) + 12) % 12;

  return utcNoon(
    year,
    month,
    Math.min(date.getUTCDate(), daysInMonthUTC(year, month))
  );
};

export const startOfDayUTC = (date: Date) =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );

export const endOfDayUTC = (date: Date) =>
  new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23,
      59,
      59,
      999
    )
  );

export const dateKeyUTC = (date: Date) =>
  [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");

export const parseDayUTC = (value: string) => {
  const [year = 0, month = 1, day = 1] = value.split("-").map(Number);

  return utcNoon(year, month - 1, day);
};

export const eachDayUTC = (from: Date, to: Date, limit: number) => {
  const days: Date[] = [];

  let cursor = toUtcNoon(from);
  const last = toUtcNoon(to);

  while (cursor.getTime() <= last.getTime() && days.length < limit) {
    days.push(cursor);
    cursor = addDaysUTC(cursor, 1);
  }

  return days;
};
