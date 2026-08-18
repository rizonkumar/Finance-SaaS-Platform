import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useGetCategories } from "@/features/categories/api/use-get-categories";
import { useCreateBudget } from "@/features/budgets/api/use-create-budget";
import {
  BudgetForm,
  type BudgetApiValues,
} from "@/features/budgets/components/budget-form";
import { useNewBudget } from "@/features/budgets/hooks/use-new-budget";

export const NewBudgetSheet = () => {
  const { isOpen, onClose } = useNewBudget();

  const mutation = useCreateBudget();
  const categoriesQuery = useGetCategories();

  const categoryOptions = (categoriesQuery.data ?? []).map((category) => ({
    label: category.name,
    value: category.id,
  }));

  const onSubmit = (values: BudgetApiValues) => {
    mutation.mutate(values, { onSuccess: onClose });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="space-y-4">
        <SheetHeader>
          <SheetTitle>New Budget</SheetTitle>
          <SheetDescription>
            Set a spending limit for a category or for everything at once.
          </SheetDescription>
        </SheetHeader>
        <BudgetForm
          onSubmit={onSubmit}
          disabled={mutation.isPending || categoriesQuery.isLoading}
          categoryOptions={categoryOptions}
          defaultValues={{
            categoryId: null,
            amount: "",
            period: "monthly",
            startDate: new Date(),
            endDate: null,
          }}
        />
      </SheetContent>
    </Sheet>
  );
};
