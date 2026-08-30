"use client";

import { Play } from "lucide-react";
import { RowActions } from "@/components/row-actions";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

import { useDeleteRecurring } from "@/features/recurring/api/use-delete-recurring";
import { useRunRecurring } from "@/features/recurring/api/use-run-recurring";
import { useOpenRecurring } from "@/features/recurring/hooks/use-open-recurring";
import { useConfirm } from "@/hooks/use-confirm";

type Props = {
  id: string;
};

export const Actions = ({ id }: Props) => {
  const [ConfirmDialog, confirm] = useConfirm(
    "Delete this schedule?",
    "Transactions already generated from it are kept as history.",
    { confirmLabel: "Delete Schedule" }
  );

  const deleteMutation = useDeleteRecurring(id);
  const runMutation = useRunRecurring(id);
  const { onOpen } = useOpenRecurring();

  const isPending = deleteMutation.isPending || runMutation.isPending;

  const handleDelete = async () => {
    if (await confirm()) {
      deleteMutation.mutate({ deleteTransactions: false });
    }
  };

  return (
    <>
      <ConfirmDialog />
      <RowActions
        label="Schedule actions"
        disabled={isPending}
        onEdit={() => onOpen(id)}
        onDelete={handleDelete}
      >
        <DropdownMenuItem
          disabled={isPending}
          onClick={() => runMutation.mutate()}
        >
          <Play className="mr-2 size-4" />
          Generate Now
        </DropdownMenuItem>
      </RowActions>
    </>
  );
};
