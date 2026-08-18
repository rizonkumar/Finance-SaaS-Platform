import type { Column, RowData } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";

const SORT_ICON: Record<string, typeof ArrowUpDown> = {
  asc: ArrowUp,
  desc: ArrowDown,
};
import type { tableFeatureSet } from "@/lib/table-features";

type Props<TData extends RowData> = {
  column: Column<typeof tableFeatureSet, TData, unknown>;
  label: string;
};

export function SortableHeader<TData extends RowData>({
  column,
  label,
}: Props<TData>) {
  const sorted = column.getIsSorted();
  const Icon = SORT_ICON[String(sorted)] ?? ArrowUpDown;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-1.5"
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {label}
      <Icon className="size-3.5" />
    </Button>
  );
}
