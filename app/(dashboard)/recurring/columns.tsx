"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Pause } from "lucide-react";

import { SortableHeader } from "@/components/sortable-header";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DISPLAY_DATE_FORMAT } from "@/lib/constants";
import type { tableFeatureSet } from "@/lib/table-features";
import { formatCurrency } from "@/lib/utils";

export type RecurringRow = {
  id: string;
  payee: string;
  amount: number;
  account: string;
  toAccount: string | null;
  category: string | null;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  isActive: boolean;
  nextOccurrence: string | null;
  generatedCount: number;
};

const cadenceLabel = (row: RecurringRow) => {
  const unit = row.frequency.replace("ly", "");
  const singular = { dai: "day", week: "week", month: "month", year: "year" }[
    unit
  ];

  return row.interval === 1
    ? `Every ${singular}`
    : `Every ${row.interval} ${singular}s`;
};

export const columns: ColumnDef<typeof tableFeatureSet, RecurringRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
  },
  {
    accessorKey: "payee",
    header: ({ column }) => <SortableHeader column={column} label="Payee" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-x-2">
        <span className="line-clamp-1">{row.original.payee}</span>
        {!row.original.isActive && (
          <Badge variant="muted">
            <Pause className="size-3" />
            Paused
          </Badge>
        )}
      </div>
    ),
  },
  {
    accessorKey: "amount",
    header: ({ column }) => <SortableHeader column={column} label="Amount" />,
    cell: ({ row }) => (
      <Badge variant={row.original.amount < 0 ? "expense" : "income"}>
        <span className="numeric">{formatCurrency(row.original.amount)}</span>
      </Badge>
    ),
  },
  {
    id: "cadence",
    header: "Repeats",
    cell: ({ row }) => (
      <span className="copy-13 text-gray-900">
        {cadenceLabel(row.original)}
      </span>
    ),
  },
  {
    accessorKey: "nextOccurrence",
    header: ({ column }) => <SortableHeader column={column} label="Next" />,
    cell: ({ row }) => {
      const next = row.original.nextOccurrence;

      return (
        <span className="numeric text-xs text-gray-900">
          {next ? format(new Date(next), DISPLAY_DATE_FORMAT) : "—"}
        </span>
      );
    },
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const { toAccount, category } = row.original;

      if (toAccount) {
        return <Badge variant="info">Transfer to {toAccount}</Badge>;
      }

      return (
        <span className="copy-13 text-gray-900">
          {category ?? "Uncategorised"}
        </span>
      );
    },
  },
  {
    accessorKey: "account",
    header: "Account",
    cell: ({ row }) => (
      <span className="copy-13 text-gray-900">{row.original.account}</span>
    ),
  },
  {
    accessorKey: "generatedCount",
    header: "Created",
    cell: ({ row }) => (
      <span className="numeric text-xs text-gray-900">
        {row.original.generatedCount}
      </span>
    ),
  },
];
