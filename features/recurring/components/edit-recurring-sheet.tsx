import { Loader2 } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useDeleteRecurring } from "@/features/recurring/api/use-delete-recurring";
import { useEditRecurring } from "@/features/recurring/api/use-edit-recurring";
import { useGetRecurring } from "@/features/recurring/api/use-get-recurring";
import {
  RecurringForm,
  type RecurringApiValues,
} from "@/features/recurring/components/recurring-form";
import { useOpenRecurring } from "@/features/recurring/hooks/use-open-recurring";
import { useRecurringOptions } from "@/features/recurring/hooks/use-recurring-options";
import { useConfirm } from "@/hooks/use-confirm";

export const EditRecurringSheet = () => {
  const { isOpen, onClose, id } = useOpenRecurring();

  const [ConfirmDialog, confirm] = useConfirm(
    "Delete this schedule?",
    "Transactions already generated from it are kept as history.",
    { confirmLabel: "Delete Schedule" }
  );

  const recurringQuery = useGetRecurring(id);
  const editMutation = useEditRecurring(id);
  const deleteMutation = useDeleteRecurring(id);
  const options = useRecurringOptions();

  const isPending =
    editMutation.isPending || deleteMutation.isPending || options.isPending;
  const isLoading = recurringQuery.isLoading || options.isLoading;

  const onSubmit = (values: RecurringApiValues) => {
    editMutation.mutate(values, { onSuccess: onClose });
  };

  const onDelete = async () => {
    if (await confirm()) {
      deleteMutation.mutate(
        { deleteTransactions: false },
        { onSuccess: onClose }
      );
    }
  };

  const data = recurringQuery.data;

  return (
    <>
      <ConfirmDialog />
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="space-y-4">
          <SheetHeader>
            <SheetTitle>Edit Recurring Transaction</SheetTitle>
            <SheetDescription>
              Changing the schedule rebuilds the transactions generated from it.
            </SheetDescription>
          </SheetHeader>
          {isLoading || !data ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="size-4 animate-spin text-gray-600" />
            </div>
          ) : (
            <RecurringForm
              id={id}
              onSubmit={onSubmit}
              onDelete={onDelete}
              disabled={isPending}
              accountOptions={options.accountOptions}
              categoryOptions={options.categoryOptions}
              debtOptions={options.debtOptions}
              onCreateAccount={options.onCreateAccount}
              onCreateCategory={options.onCreateCategory}
              defaultValues={{
                payee: data.payee,
                amount: String(data.amount),
                accountId: data.accountId,
                toAccountId: data.toAccountId,
                categoryId: data.categoryId,
                debtId: data.debtId,
                frequency: data.frequency,
                interval: String(data.interval),
                startDate: new Date(data.startDate),
                endDate: data.endDate ? new Date(data.endDate) : null,
                notes: data.notes,
                isActive: data.isActive,
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};
