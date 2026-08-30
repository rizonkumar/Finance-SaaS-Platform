import { SheetFormLoading } from "@/components/sheet-form-loading";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useGetAccounts } from "@/features/accounts/api/use-get-accounts";
import { useDeleteDebt } from "@/features/debts/api/use-delete-debt";
import { useEditDebt } from "@/features/debts/api/use-edit-debt";
import { useGetDebt } from "@/features/debts/api/use-get-debt";
import {
  DebtForm,
  type DebtApiValues,
} from "@/features/debts/components/debt-form";
import { useOpenDebt } from "@/features/debts/hooks/use-open-debt";
import { useConfirm } from "@/hooks/use-confirm";
import { aprFromBasisPoints } from "@/lib/debts";

export const EditDebtSheet = () => {
  const { isOpen, onClose, id } = useOpenDebt();

  const [ConfirmDialog, confirm] = useConfirm(
    "Delete this debt?",
    "Its payment history goes with it. Your transactions stay untouched.",
    { confirmLabel: "Delete Debt" }
  );

  const debtQuery = useGetDebt(id);
  const editMutation = useEditDebt(id);
  const deleteMutation = useDeleteDebt(id);
  const accountsQuery = useGetAccounts();

  const isPending = editMutation.isPending || deleteMutation.isPending;
  const isLoading = debtQuery.isLoading || accountsQuery.isLoading;
  const debt = debtQuery.data;

  const accountOptions = (accountsQuery.data ?? []).map((account) => ({
    label: account.name,
    value: account.id,
  }));

  const onSubmit = (values: DebtApiValues) => {
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
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Debt</SheetTitle>
            <SheetDescription>
              Update the rate, the payment or the date you want it gone by.
            </SheetDescription>
          </SheetHeader>
          {isLoading ? (
            <SheetFormLoading />
          ) : (
            <DebtForm
              id={id}
              onSubmit={onSubmit}
              onDelete={onDelete}
              disabled={isPending}
              isSubmitting={editMutation.isPending}
              isDeleting={deleteMutation.isPending}
              accountOptions={accountOptions}
              defaultValues={{
                name: debt?.name ?? "",
                kind: debt?.kind ?? "loan",
                principal: debt ? String(debt.principal) : "",
                apr: debt
                  ? String(aprFromBasisPoints(debt.aprBasisPoints))
                  : "",
                minimumPayment: debt ? String(debt.minimumPayment) : "",
                accountId: debt?.accountId ?? null,
                startDate: debt ? new Date(debt.startDate) : new Date(),
                hasDeadline: !!debt?.targetDate,
                targetDate: debt?.targetDate ? new Date(debt.targetDate) : null,
                notes: debt?.notes ?? null,
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};
