"use client";

import { Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

type Props = {
  selectedCount: number;
  totalCount: number;
  itemLabel: string;
  onToggleSelectAll: (checked: boolean) => void;
  onDelete: () => void;
  disabled?: boolean;
};

export const BulkSelectionBar = ({
  selectedCount,
  totalCount,
  itemLabel,
  onToggleSelectAll,
  onDelete,
  disabled,
}: Props) => (
  <div className="border-border flex items-center justify-between rounded-md border bg-gray-100 px-3 py-2.5">
    <div className="flex items-center gap-2">
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
