import { format } from "date-fns";
import { Loader2, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useGetAccounts } from "@/features/accounts/api/use-get-accounts";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAddContribution } from "@/features/goals/api/use-add-contribution";
import { useDeleteContribution } from "@/features/goals/api/use-delete-contribution";
import { useGetGoal } from "@/features/goals/api/use-get-goal";
import {
  ContributionForm,
  type ContributionApiValues,
} from "@/features/goals/components/contribution-form";
import { useContributeGoal } from "@/features/goals/hooks/use-contribute-goal";
import { DISPLAY_DATE_FORMAT } from "@/lib/constants";
import { cn, formatCurrency } from "@/lib/utils";

export const ContributeGoalSheet = () => {
  const { isOpen, onClose, id } = useContributeGoal();

  const accountsQuery = useGetAccounts();
  const accountOptions = (accountsQuery.data ?? []).map((account) => ({
    label: account.name,
    value: account.id,
  }));

  const goalQuery = useGetGoal(id);
  const addMutation = useAddContribution(id);
  const deleteMutation = useDeleteContribution(id);

  const isPending = addMutation.isPending || deleteMutation.isPending;
  const goal = goalQuery.data;
  const contributions = goal?.contributions ?? [];

  const onSubmit = (values: ContributionApiValues) => {
    addMutation.mutate(values);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="space-y-4 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{goal?.name ?? "Add Funds"}</SheetTitle>
          <SheetDescription>
            {goal
              ? `${formatCurrency(goal.saved)} of ${formatCurrency(
                  goal.targetAmount
                )} saved so far.`
              : "Record money set aside for this goal."}
          </SheetDescription>
        </SheetHeader>
        {goalQuery.isLoading || accountsQuery.isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="size-4 animate-spin text-gray-600" />
          </div>
        ) : (
          <div className="space-y-4">
            <ContributionForm
              onSubmit={onSubmit}
              disabled={isPending}
              accountOptions={accountOptions}
              defaultAccountId={goal?.accountId}
            />
            <Separator />
            <div className="space-y-2">
              <p className="label-14 text-gray-1000">History</p>
              {contributions.length === 0 ? (
                <p className="copy-13 text-gray-900">
                  Nothing recorded yet. Entries you add show up here.
                </p>
              ) : (
                <ul className="divide-border divide-y">
                  {contributions.map((contribution) => (
                    <li
                      key={contribution.id}
                      className="flex items-start justify-between gap-x-3 py-2"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <p
                          className={cn(
                            "numeric text-sm font-medium",
                            contribution.amount < 0
                              ? "text-red-900"
                              : "text-green-900"
                          )}
                        >
                          {contribution.amount < 0 ? "−" : "+"}
                          {formatCurrency(Math.abs(contribution.amount))}
                        </p>
                        <p className="copy-13 text-gray-900">
                          {format(
                            new Date(contribution.date),
                            DISPLAY_DATE_FORMAT
                          )}
                        </p>
                        {contribution.notes && (
                          <p className="copy-13 text-gray-900">
                            {contribution.notes}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={isPending}
                        aria-label="Delete entry"
                        onClick={() => deleteMutation.mutate(contribution.id)}
                      >
                        <Trash className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
