import { SheetFormLoading } from "@/components/sheet-form-loading";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCategoryOptions } from "@/features/categories/hooks/use-category-options";
import { useDeleteRule } from "@/features/rules/api/use-delete-rule";
import { useEditRule } from "@/features/rules/api/use-edit-rule";
import { useGetRule } from "@/features/rules/api/use-get-rule";
import {
  RuleForm,
  type RuleApiValues,
} from "@/features/rules/components/rule-form";
import { useOpenRule } from "@/features/rules/hooks/use-open-rule";
import { useConfirm } from "@/hooks/use-confirm";

export const EditRuleSheet = () => {
  const { isOpen, onClose, id } = useOpenRule();

  const [ConfirmDialog, confirm] = useConfirm(
    "Delete this rule?",
    "Transactions it already categorised keep their category.",
    { confirmLabel: "Delete rule" }
  );

  const ruleQuery = useGetRule(id);
  const editMutation = useEditRule(id);
  const deleteMutation = useDeleteRule();
  const categories = useCategoryOptions();

  const isPending =
    editMutation.isPending || deleteMutation.isPending || categories.isCreating;

  const onSubmit = (values: RuleApiValues) => {
    editMutation.mutate(values, { onSuccess: onClose });
  };

  const onDelete = async () => {
    if (id && (await confirm())) {
      deleteMutation.mutate(id, { onSuccess: onClose });
    }
  };

  const rule = ruleQuery.data;

  return (
    <>
      <ConfirmDialog />
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Rule</SheetTitle>
            <SheetDescription>
              Changes apply to transactions added from now on.
            </SheetDescription>
          </SheetHeader>
          {ruleQuery.isLoading || categories.isLoading ? (
            <SheetFormLoading />
          ) : (
            <RuleForm
              id={id}
              defaultValues={
                rule && {
                  pattern: rule.pattern,
                  match: rule.match,
                  categoryId: rule.categoryId,
                  priority: rule.priority,
                }
              }
              onSubmit={onSubmit}
              onDelete={onDelete}
              disabled={isPending}
              isSubmitting={editMutation.isPending}
              isDeleting={deleteMutation.isPending}
              categoryOptions={categories.options}
              onCreateCategory={categories.onCreate}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};
