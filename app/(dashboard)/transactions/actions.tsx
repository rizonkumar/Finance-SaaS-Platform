"use client";

import { Edit, MoreHorizontal, Trash } from "lucide-react";

import { useOpenTransaction } from "@/features/transactions/hooks/use-open-transaction";
import { useDeleteTransaction } from "@/features/transactions/api/use-delete-transaction";
import { useDeleteTransfer } from "@/features/transfers/api/use-delete-transfer";
import { useOpenTransfer } from "@/features/transfers/hooks/use-open-transfer";

import { useConfirm } from "@/hooks/use-confirm";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  id: string;
  transferId: string | null;
};

export const Actions = ({ id, transferId }: Props) => {
  const isTransfer = !!transferId;

  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    isTransfer
      ? "You are about to delete this transfer. Both sides of it go together."
      : "You are about to delete this transaction."
  );

  const deleteTransaction = useDeleteTransaction(id);
  const deleteTransfer = useDeleteTransfer(transferId ?? undefined);
  const deleteMutation = isTransfer ? deleteTransfer : deleteTransaction;

  const openTransaction = useOpenTransaction();
  const openTransfer = useOpenTransfer();

  const handleEdit = () => {
    if (transferId) return openTransfer.onOpen(transferId);

    openTransaction.onOpen(id);
  };

  const handleDelete = async () => {
    const ok = await confirm();

    if (ok) {
      deleteMutation.mutate(undefined);
    }
  };

  return (
    <>
      <ConfirmDialog />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="size-8 p-0">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            disabled={deleteMutation.isPending}
            onClick={handleEdit}
          >
            <Edit className="mr-2 size-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={deleteMutation.isPending}
            onClick={handleDelete}
          >
            <Trash className="mr-2 size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
