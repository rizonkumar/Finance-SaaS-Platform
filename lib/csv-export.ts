export type CsvCell = string | number | null | undefined;

export type CsvTable = {
  headers: string[];
  rows: CsvCell[][];
};

const FORMULA_PREFIX = /^[=+\-@\t\r]/;
const NEEDS_QUOTES = /[",\r\n]/;

export function escapeCsvCell(cell: CsvCell): string {
  if (cell === null || cell === undefined) return "";
  if (typeof cell === "number") return String(cell);

  const guarded = FORMULA_PREFIX.test(cell) ? `'${cell}` : cell;

  return NEEDS_QUOTES.test(guarded)
    ? `"${guarded.replaceAll('"', '""')}"`
    : guarded;
}

export function toCsv({ headers, rows }: CsvTable): string {
  return [headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\r\n");
}

export const csvFilename = (name: string, date: Date = new Date()) =>
  `${name}-${date.toISOString().slice(0, 10)}.csv`;
