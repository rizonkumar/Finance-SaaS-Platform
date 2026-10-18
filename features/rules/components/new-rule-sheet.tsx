import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCategoryOptions } from "@/features/categories/hooks/use-category-options";
import { useCreateRule } from "@/features/rules/api/use-create-rule";
import {
  RuleForm,
  type RuleApiValues,
} from "@/features/rules/components/rule-form";
import { useNewRule } from "@/features/rules/hooks/use-new-rule";

export const NewRuleSheet = () => {
  const { isOpen, onClose } = useNewRule();
  const mutation = useCreateRule();
  const categories = useCategoryOptions();

  const onSubmit = (values: RuleApiValues) => {
    mutation.mutate(values, { onSuccess: onClose });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>New Rule</SheetTitle>
          <SheetDescription>
            New and imported transactions from a matching payee get this
            category automatically.
          </SheetDescription>
        </SheetHeader>
        <RuleForm
          onSubmit={onSubmit}
          disabled={mutation.isPending || categories.isCreating}
          isSubmitting={mutation.isPending}
          categoryOptions={categories.options}
          onCreateCategory={categories.onCreate}
        />
      </SheetContent>
    </Sheet>
  );
};
