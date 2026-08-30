import { SheetFormLoading } from "@/components/sheet-form-loading";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useDeleteBudget } from "@/features/budgets/api/use-delete-budget";
import { useEditBudget } from "@/features/budgets/api/use-edit-budget";
import { useGetBudget } from "@/features/budgets/api/use-get-budget";
import {
  BudgetForm,
  type BudgetApiValues,
} from "@/features/budgets/components/budget-form";
import { useOpenBudget } from "@/features/budgets/hooks/use-open-budget";
import { useGetCategories } from "@/features/categories/api/use-get-categories";
import { useConfirm } from "@/hooks/use-confirm";

export const EditBudgetSheet = () => {
  const { isOpen, onClose, id } = useOpenBudget();

  const [ConfirmDialog, confirm] = useConfirm(
    "Delete this budget?",
    "Your transactions stay untouched — only the budget is removed.",
    { confirmLabel: "Delete Budget" }
  );

  const budgetQuery = useGetBudget(id);
  const editMutation = useEditBudget(id);
  const deleteMutation = useDeleteBudget(id);
  const categoriesQuery = useGetCategories();

  const isPending = editMutation.isPending || deleteMutation.isPending;
  const isLoading = budgetQuery.isLoading || categoriesQuery.isLoading;

  const categoryOptions = (categoriesQuery.data ?? []).map((category) => ({
    label: category.name,
    value: category.id,
  }));

  const onSubmit = (values: BudgetApiValues) => {
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
            <SheetTitle>Edit Budget</SheetTitle>
            <SheetDescription>Update this spending limit.</SheetDescription>
          </SheetHeader>
          {isLoading ? (
            <SheetFormLoading />
          ) : (
            <BudgetForm
              id={id}
              onSubmit={onSubmit}
              onDelete={onDelete}
              disabled={isPending}
              isSubmitting={editMutation.isPending}
              isDeleting={deleteMutation.isPending}
              categoryOptions={categoryOptions}
              defaultValues={{
                categoryId: budgetQuery.data?.categoryId ?? null,
                amount: budgetQuery.data ? String(budgetQuery.data.amount) : "",
                period: budgetQuery.data?.period ?? "monthly",
                startDate: budgetQuery.data
                  ? new Date(budgetQuery.data.startDate)
                  : new Date(),
                endDate: budgetQuery.data?.endDate
                  ? new Date(budgetQuery.data.endDate)
                  : null,
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};
