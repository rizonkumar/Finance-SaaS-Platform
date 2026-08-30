"use client";

import { Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

type Props = {
  selectedCount: number;
  totalCount: number;
  onToggleSelectAll: (checked: boolean) => void;
  onDelete: () => void;
  disabled?: boolean;
};

export const BulkSelectionBar = ({
  selectedCount,
  totalCount,
  onToggleSelectAll,
  onDelete,
  disabled,
}: Props) => {
  if (selectedCount === 0) return null;

  return (
    <div className="border-border flex items-center justify-between rounded-md border bg-gray-100 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <Checkbox
          checked={totalCount > 0 && selectedCount === totalCount}
          onCheckedChange={(checked) => onToggleSelectAll(!!checked)}
          aria-label="Select all"
        />
        <span className="copy-13 text-gray-1000 font-medium">
          {selectedCount} of {totalCount} selected
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        onClick={onDelete}
      >
        <Trash />
        Delete selected
      </Button>
    </div>
  );
};
