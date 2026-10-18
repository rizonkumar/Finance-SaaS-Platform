import { format } from "date-fns";

import { DATE_FORMAT } from "@/lib/constants";
import { type CsvTable } from "@/lib/csv-export";

export const UNCATEGORIZED = "Uncategorized";
export const TRANSFER = "Transfer";

type ExportSplit = {
  category: string | null;
};

export type ExportableTransaction = {
  date: string | Date;
  payee: string;
  category: string | null;
  account: string;
  amount: number;
  notes: string | null;
  transferId: string | null;
  splits: ExportSplit[];
};

export function categoryLabel(
  transaction: Pick<ExportableTransaction, "transferId" | "category" | "splits">
) {
  if (transaction.transferId) return TRANSFER;

  if (transaction.splits.length > 0) {
    return transaction.splits
      .map((split) => split.category ?? UNCATEGORIZED)
      .join(" / ");
  }

  return transaction.category ?? UNCATEGORIZED;
}

export function transactionsCsvTable(
  transactions: ExportableTransaction[]
): CsvTable {
  return {
    headers: ["Date", "Payee", "Category", "Account", "Amount", "Notes"],
    rows: transactions.map((transaction) => [
      format(new Date(transaction.date), DATE_FORMAT),
      transaction.payee,
      categoryLabel(transaction),
      transaction.account,
      transaction.amount,
      transaction.notes,
    ]),
  };
}
