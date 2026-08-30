"use client";

import { RowActions } from "@/components/row-actions";

import { useOpenTransaction } from "@/features/transactions/hooks/use-open-transaction";
import { useDeleteTransaction } from "@/features/transactions/api/use-delete-transaction";
import { useDeleteTransfer } from "@/features/transfers/api/use-delete-transfer";
import { useOpenTransfer } from "@/features/transfers/hooks/use-open-transfer";

import { useConfirm } from "@/hooks/use-confirm";

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
      <RowActions
        label="Transaction actions"
        disabled={deleteMutation.isPending}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </>
  );
};
