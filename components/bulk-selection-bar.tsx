"use client";

import { Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type Props = {
  selectedCount: number;
  totalCount: number;
  itemLabel: string;
  onToggleSelectAll: (checked: boolean) => void;
  onDelete: () => void;
  disabled?: boolean;
  /**
   * true (default): standalone bordered banner floating above a card grid.
   * false: a flush header row with no side padding, for direct use above a
   * `divide-y` list — its checkbox must land at the same x as the row
   * checkboxes below it, which the bordered/padded treatment breaks.
   */
  bordered?: boolean;
};

export const BulkSelectionBar = ({
  selectedCount,
  totalCount,
  itemLabel,
  onToggleSelectAll,
  onDelete,
  disabled,
  bordered = true,
}: Props) => (
  <div
    className={cn(
      "flex items-center justify-between",
      bordered
        ? "border-border rounded-md border bg-gray-100 px-3 py-2.5"
        : "border-alpha-300 border-b pb-2.5"
    )}
  >
    <div className="flex items-center gap-x-3">
      <Checkbox
        checked={totalCount > 0 && selectedCount === totalCount}
        onCheckedChange={(checked) => onToggleSelectAll(!!checked)}
        aria-label="Select all"
      />
      <span className="copy-13 text-gray-1000 font-medium">
        {selectedCount > 0
          ? `${selectedCount} of ${totalCount} selected`
          : itemLabel}
      </span>
    </div>
    {selectedCount > 0 && (
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        onClick={onDelete}
      >
        <Trash />
        Delete selected
      </Button>
    )}
  </div>
);
