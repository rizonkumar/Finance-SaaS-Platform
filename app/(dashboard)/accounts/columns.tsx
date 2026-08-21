"use client";

import { type InferResponseType } from "hono";
import { type ColumnDef } from "@tanstack/react-table";

import { SortableHeader } from "@/components/sortable-header";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ACCOUNT_TYPE_LABELS } from "@/lib/constants";
import { type client } from "@/lib/hono";
import { type tableFeatureSet } from "@/lib/table-features";
import { convertAmountFromMiliunits, formatCurrency } from "@/lib/utils";

import { Actions } from "./actions";

export type ResponseType = InferResponseType<
  typeof client.api.accounts.$get,
  200
>["data"][0];

export const columns: ColumnDef<typeof tableFeatureSet, ResponseType>[] = [
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
    accessorKey: "name",
    header: ({ column }) => <SortableHeader column={column} label="Name" />,
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <span className="copy-13 text-gray-900">
        {ACCOUNT_TYPE_LABELS[row.original.type]}
      </span>
    ),
  },
  {
    accessorKey: "balance",
    header: ({ column }) => <SortableHeader column={column} label="Balance" />,
    cell: ({ row }) => {
      const balance = convertAmountFromMiliunits(row.original.balance);

      return (
        <Badge variant={balance < 0 ? "expense" : "income"}>
          <span className="numeric">{formatCurrency(balance)}</span>
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <Actions id={row.original.id} />,
  },
];
