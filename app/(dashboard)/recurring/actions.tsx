"use client";

import { Edit, MoreHorizontal, Play, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Schedule actions">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled={isPending} onClick={() => onOpen(id)}>
            <Edit className="mr-2 size-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isPending}
            onClick={() => runMutation.mutate()}
          >
            <Play className="mr-2 size-4" />
            Generate Now
          </DropdownMenuItem>
          <DropdownMenuItem disabled={isPending} onClick={handleDelete}>
            <Trash className="mr-2 size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
