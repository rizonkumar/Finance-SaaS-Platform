import { parseDayUTC } from "@/lib/date-utc";

export const DUPLICATE_DAY_TOLERANCE = 1;

const DAY_MS = 86_400_000;

export type DuplicateCandidate = {
  date: string;
  amount: number;
  payee: string;
};

export const duplicateKey = ({
  amount,
  payee,
}: Pick<DuplicateCandidate, "amount" | "payee">) =>
  [amount, payee.trim().toLowerCase().replace(/\s+/g, " ")].join("|");

const dayNumber = (date: string) =>
  Math.round(parseDayUTC(date).getTime() / DAY_MS);

function closestDay(days: number[], target: number) {
  let best = { index: -1, distance: DUPLICATE_DAY_TOLERANCE + 1 };

  days.forEach((day, index) => {
    const distance = Math.abs(day - target);

    if (distance < best.distance) best = { index, distance };
  });

  return best.index;
}

export function findDuplicateIndexes(
  candidates: DuplicateCandidate[],
  existing: DuplicateCandidate[]
): number[] {
  const remaining = new Map<string, number[]>();

  for (const row of existing) {
    const key = duplicateKey(row);
    remaining.set(key, [...(remaining.get(key) ?? []), dayNumber(row.date)]);
  }

  return candidates.flatMap((candidate, index) => {
    const days = remaining.get(duplicateKey(candidate)) ?? [];
    const match = closestDay(days, dayNumber(candidate.date));

    if (match === -1) return [];

    days.splice(match, 1);

    return [index];
  });
}

export const withoutIndexes = <T>(rows: T[], indexes: number[]): T[] => {
  const skipped = new Set(indexes);

  return rows.filter((_row, index) => !skipped.has(index));
};
