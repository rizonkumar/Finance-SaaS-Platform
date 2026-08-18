import { format, parse } from "date-fns";

import { DATE_FORMAT, DATE_TIME_FORMAT } from "@/lib/constants";
import { convertAmountToMiliunits } from "@/lib/utils";

export const REQUIRED_IMPORT_COLUMNS = ["amount", "date", "payee"] as const;

export const SKIP_COLUMN = "skip";

export type SelectedColumns = Record<string, string | null>;

export type ImportedTransaction = {
  amount: number;
  date: string;
  payee: string;
  notes?: string;
};

export const columnKey = (index: number) => `column_${index}`;

export function assignColumn(
  selected: SelectedColumns,
  columnIndex: number,
  value: string | null
): SelectedColumns {
  const next: SelectedColumns = {};

  for (const [key, current] of Object.entries(selected)) {
    next[key] = current === value ? null : current;
  }

  next[columnKey(columnIndex)] = value === SKIP_COLUMN ? null : value;

  return next;
}

export function countMappedColumns(selected: SelectedColumns): number {
  return Object.values(selected).filter(Boolean).length;
}

function buildRow(
  row: string[],
  headers: (string | null)[]
): Record<string, string> | null {
  const entry: Record<string, string> = {};
  let hasValue = false;

  headers.forEach((header, index) => {
    const cell = row[index];

    if (header === null || cell === undefined) return;

    entry[header] = cell;
    hasValue = true;
  });

  return hasValue ? entry : null;
}

export function mapImportedRows(
  headers: string[],
  body: string[][],
  selected: SelectedColumns
): ImportedTransaction[] {
  const mappedHeaders = headers.map(
    (_header, index) => selected[columnKey(index)] ?? null
  );

  return body
    .map((row) => buildRow(row, mappedHeaders))
    .filter((entry): entry is Record<string, string> => entry !== null)
    .map((entry) => ({
      ...entry,
      amount: convertAmountToMiliunits(parseFloat(entry.amount ?? "0")),
      date: format(
        parse(entry.date ?? "", DATE_TIME_FORMAT, new Date()),
        DATE_FORMAT
      ),
      payee: entry.payee ?? "",
    }));
}
