"use client";

import { format } from "date-fns";
import { type InferResponseType } from "hono";
import { ArrowLeftRight, Repeat } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";

import { type client } from "@/lib/hono";
import { formatCurrency } from "@/lib/utils";
import { type tableFeatureSet } from "@/lib/table-features";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { SortableHeader } from "@/components/sortable-header";

import { Actions } from "./actions";
import { AccountColumn } from "./account-column";
import { CategoryColumn } from "./category-column";

export type ResponseType = InferResponseType<
  typeof client.api.transactions.$get,
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
    accessorKey: "date",
    header: ({ column }) => <SortableHeader column={column} label="Date" />,
    cell: ({ row }) => {
      const date = row.getValue("date") as Date;

      return <span>{format(date, "dd MMMM, yyyy")}</span>;
    },
  },
  {
    accessorKey: "category",
    header: ({ column }) => <SortableHeader column={column} label="Category" />,
    cell: ({ row }) => {
      return (
        <CategoryColumn
          id={row.original.id}
          category={row.original.category}
          categoryId={row.original.categoryId}
          transferId={row.original.transferId}
        />
      );
    },
  },
  {
    accessorKey: "payee",
    header: ({ column }) => <SortableHeader column={column} label="Payee" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-x-2">
        <span className="line-clamp-1">{row.original.payee}</span>
        {row.original.recurringId && (
          <Badge variant="info" title="Generated from a recurring schedule">
            <Repeat className="size-3" />
            Recurring
          </Badge>
        )}
        {row.original.transferId && (
          <Badge
            variant="muted"
            title="One leg of a transfer between your own accounts"
          >
            <ArrowLeftRight className="size-3" />
            Transfer
          </Badge>
        )}
      </div>
    ),
  },
  {
    accessorKey: "amount",
    header: ({ column }) => <SortableHeader column={column} label="Amount" />,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));

      return (
        <Badge variant={amount < 0 ? "expense" : "income"}>
          {formatCurrency(amount)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "account",
    header: ({ column }) => <SortableHeader column={column} label="Account" />,
    cell: ({ row }) => {
      return (
        <AccountColumn
          account={row.original.account}
          accountId={row.original.accountId}
        />
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Actions id={row.original.id} transferId={row.original.transferId} />
    ),
  },
];
