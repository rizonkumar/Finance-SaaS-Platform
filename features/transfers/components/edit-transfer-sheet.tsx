import { Loader2 } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useGetAccounts } from "@/features/accounts/api/use-get-accounts";
import { useDeleteTransfer } from "@/features/transfers/api/use-delete-transfer";
import { useEditTransfer } from "@/features/transfers/api/use-edit-transfer";
import { useGetTransfer } from "@/features/transfers/api/use-get-transfer";
import {
  TransferForm,
  type TransferApiValues,
} from "@/features/transfers/components/transfer-form";
import { useOpenTransfer } from "@/features/transfers/hooks/use-open-transfer";
import { useConfirm } from "@/hooks/use-confirm";

export const EditTransferSheet = () => {
  const { isOpen, onClose, id } = useOpenTransfer();

  const [ConfirmDialog, confirm] = useConfirm(
    "Delete this transfer?",
    "Both sides of it leave the ledger together.",
    { confirmLabel: "Delete Transfer" }
  );

  const transferQuery = useGetTransfer(id);
  const editMutation = useEditTransfer(id);
  const deleteMutation = useDeleteTransfer(id);
  const accountsQuery = useGetAccounts();

  const isPending = editMutation.isPending || deleteMutation.isPending;
  const isLoading = transferQuery.isLoading || accountsQuery.isLoading;
  const transfer = transferQuery.data;

  const accountOptions = (accountsQuery.data ?? []).map((account) => ({
    label: account.name,
    value: account.id,
  }));

  const onSubmit = (values: TransferApiValues) => {
    editMutation.mutate(values, { onSuccess: onClose });
  };

  const onDelete = async () => {
    if (await confirm()) {
      deleteMutation.mutate(undefined, { onSuccess: onClose });
    }
  };

  return (
    <>
      <ConfirmDialog />
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="space-y-4 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Transfer</SheetTitle>
            <SheetDescription>
              Change the amount, the date or either end of the transfer.
            </SheetDescription>
          </SheetHeader>
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="size-4 animate-spin text-gray-600" />
            </div>
          ) : (
            <TransferForm
              id={id}
              onSubmit={onSubmit}
              onDelete={onDelete}
              disabled={isPending}
              isSubmitting={editMutation.isPending}
              isDeleting={deleteMutation.isPending}
              accountOptions={accountOptions}
              defaultValues={{
                date: transfer ? new Date(transfer.date) : new Date(),
                amount: transfer ? String(transfer.amount) : "",
                fromAccountId: transfer?.fromAccountId ?? "",
                toAccountId: transfer?.toAccountId ?? "",
                notes: transfer?.notes ?? null,
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};
