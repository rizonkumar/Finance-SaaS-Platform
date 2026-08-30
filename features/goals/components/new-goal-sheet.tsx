import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useGetAccounts } from "@/features/accounts/api/use-get-accounts";
import { useCreateGoal } from "@/features/goals/api/use-create-goal";
import {
  GoalForm,
  type GoalApiValues,
} from "@/features/goals/components/goal-form";
import { useNewGoal } from "@/features/goals/hooks/use-new-goal";

export const NewGoalSheet = () => {
  const { isOpen, onClose } = useNewGoal();

  const mutation = useCreateGoal();
  const accountsQuery = useGetAccounts();

  const accountOptions = (accountsQuery.data ?? []).map((account) => ({
    label: account.name,
    value: account.id,
  }));

  const onSubmit = (values: GoalApiValues) => {
    mutation.mutate(values, { onSuccess: onClose });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>New Goal</SheetTitle>
          <SheetDescription>
            Set a target to save towards and track your pace against it.
          </SheetDescription>
        </SheetHeader>
        <GoalForm
          onSubmit={onSubmit}
          disabled={mutation.isPending || accountsQuery.isLoading}
          isSubmitting={mutation.isPending}
          accountOptions={accountOptions}
          defaultValues={{
            name: "",
            targetAmount: "",
            accountId: null,
            startDate: new Date(),
            hasDeadline: true,
            targetDate: null,
            notes: null,
          }}
        />
      </SheetContent>
    </Sheet>
  );
};
