import { Loader2 } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCreateRecurring } from "@/features/recurring/api/use-create-recurring";
import {
  RecurringForm,
  type RecurringApiValues,
} from "@/features/recurring/components/recurring-form";
import { useNewRecurring } from "@/features/recurring/hooks/use-new-recurring";
import { useRecurringOptions } from "@/features/recurring/hooks/use-recurring-options";

export const NewRecurringSheet = () => {
  const { isOpen, onClose } = useNewRecurring();

  const createMutation = useCreateRecurring();
  const options = useRecurringOptions();

  const onSubmit = (values: RecurringApiValues) => {
    createMutation.mutate(values, { onSuccess: onClose });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="space-y-4">
        <SheetHeader>
          <SheetTitle>New Recurring Transaction</SheetTitle>
          <SheetDescription>
            Schedule a transaction that repeats. Past occurrences are created
            automatically up to today.
          </SheetDescription>
        </SheetHeader>
        {options.isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="size-4 animate-spin text-gray-600" />
          </div>
        ) : (
          <RecurringForm
            onSubmit={onSubmit}
            disabled={createMutation.isPending || options.isPending}
            accountOptions={options.accountOptions}
            categoryOptions={options.categoryOptions}
            onCreateAccount={options.onCreateAccount}
            onCreateCategory={options.onCreateCategory}
            defaultValues={{
              payee: "",
              amount: "",
              accountId: "",
              categoryId: null,
              frequency: "monthly",
              interval: "1",
              startDate: new Date(),
              endDate: null,
              notes: null,
              isActive: true,
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
};
