import { Loader2 } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useGetAccounts } from "@/features/accounts/api/use-get-accounts";
import { useDeleteGoal } from "@/features/goals/api/use-delete-goal";
import { useEditGoal } from "@/features/goals/api/use-edit-goal";
import { useGetGoal } from "@/features/goals/api/use-get-goal";
import {
  GoalForm,
  type GoalApiValues,
} from "@/features/goals/components/goal-form";
import { useOpenGoal } from "@/features/goals/hooks/use-open-goal";
import { useConfirm } from "@/hooks/use-confirm";

export const EditGoalSheet = () => {
  const { isOpen, onClose, id } = useOpenGoal();

  const [ConfirmDialog, confirm] = useConfirm(
    "Delete this goal?",
    "Its contribution history goes with it. Your transactions stay untouched.",
    { confirmLabel: "Delete Goal" }
  );

  const goalQuery = useGetGoal(id);
  const editMutation = useEditGoal(id);
  const deleteMutation = useDeleteGoal(id);
  const accountsQuery = useGetAccounts();

  const isPending = editMutation.isPending || deleteMutation.isPending;
  const isLoading = goalQuery.isLoading || accountsQuery.isLoading;

  const accountOptions = (accountsQuery.data ?? []).map((account) => ({
    label: account.name,
    value: account.id,
  }));

  const onSubmit = (values: GoalApiValues) => {
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
            <SheetTitle>Edit Goal</SheetTitle>
            <SheetDescription>
              Update the target, the deadline or where this goal lives.
            </SheetDescription>
          </SheetHeader>
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="size-4 animate-spin text-gray-600" />
            </div>
          ) : (
            <GoalForm
              id={id}
              onSubmit={onSubmit}
              onDelete={onDelete}
              disabled={isPending}
              accountOptions={accountOptions}
              defaultValues={{
                name: goalQuery.data?.name ?? "",
                targetAmount: goalQuery.data
                  ? String(goalQuery.data.targetAmount)
                  : "",
                accountId: goalQuery.data?.accountId ?? null,
                startDate: goalQuery.data
                  ? new Date(goalQuery.data.startDate)
                  : new Date(),
                hasDeadline: !!goalQuery.data?.targetDate,
                targetDate: goalQuery.data?.targetDate
                  ? new Date(goalQuery.data.targetDate)
                  : null,
                notes: goalQuery.data?.notes ?? null,
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};
