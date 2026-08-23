"use client";

import { Loader2 } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useGetAccounts } from "@/features/accounts/api/use-get-accounts";
import { useDeleteHolding } from "@/features/holdings/api/use-delete-holding";
import { useEditHolding } from "@/features/holdings/api/use-edit-holding";
import { useGetHoldings } from "@/features/holdings/api/use-get-holdings";
import {
  HoldingForm,
  type HoldingApiValues,
} from "@/features/holdings/components/holding-form";
import { useOpenHolding } from "@/features/holdings/hooks/use-open-holding";
import { useConfirm } from "@/hooks/use-confirm";
import { INVESTMENT_ACCOUNT_TYPES } from "@/lib/net-worth";

export const EditHoldingSheet = () => {
  const { isOpen, onClose, id } = useOpenHolding();

  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    "Deleting this holding removes its trades and their transactions."
  );

  const editMutation = useEditHolding(id);
  const deleteMutation = useDeleteHolding(id);
  const holdingsQuery = useGetHoldings();
  const accountsQuery = useGetAccounts();

  const holding = holdingsQuery.data?.find((row) => row.id === id);
  const isPending = editMutation.isPending || deleteMutation.isPending;

  const accountOptions = (accountsQuery.data ?? [])
    .filter((account) => INVESTMENT_ACCOUNT_TYPES.includes(account.type))
    .map((account) => ({ label: account.name, value: account.id }));

  const onSubmit = (values: HoldingApiValues) => {
    editMutation.mutate(values, { onSuccess: () => onClose() });
  };

  const onDelete = async () => {
    const ok = await confirm();

    if (!ok) return;

    deleteMutation.mutate(undefined, { onSuccess: () => onClose() });
  };

  return (
    <>
      <ConfirmDialog />
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="space-y-4 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Holding</SheetTitle>
            <SheetDescription>
              Change the symbol, name or current price.
            </SheetDescription>
          </SheetHeader>
          {holdingsQuery.isLoading || !holding ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="size-4 animate-spin text-gray-600" />
            </div>
          ) : (
            <HoldingForm
              id={holding.id}
              defaultValues={{
                accountId: holding.accountId,
                symbol: holding.symbol,
                name: holding.name,
                lastPrice: String(holding.lastPrice),
              }}
              onSubmit={onSubmit}
              onDelete={onDelete}
              disabled={isPending}
              isSubmitting={editMutation.isPending}
              isDeleting={deleteMutation.isPending}
              accountOptions={accountOptions}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};
