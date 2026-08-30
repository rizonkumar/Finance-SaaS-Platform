import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useGetAccounts } from "@/features/accounts/api/use-get-accounts";
import { useCreateDebt } from "@/features/debts/api/use-create-debt";
import {
  DebtForm,
  type DebtApiValues,
} from "@/features/debts/components/debt-form";
import { useNewDebt } from "@/features/debts/hooks/use-new-debt";

export const NewDebtSheet = () => {
  const { isOpen, onClose } = useNewDebt();

  const mutation = useCreateDebt();
  const accountsQuery = useGetAccounts();

  const accountOptions = (accountsQuery.data ?? []).map((account) => ({
    label: account.name,
    value: account.id,
  }));

  const onSubmit = (values: DebtApiValues) => {
    mutation.mutate(values, { onSuccess: onClose });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>New Debt</SheetTitle>
          <SheetDescription>
            Track what you owe and see when it clears at your current payment.
          </SheetDescription>
        </SheetHeader>
        <DebtForm
          onSubmit={onSubmit}
          disabled={mutation.isPending || accountsQuery.isLoading}
          isSubmitting={mutation.isPending}
          accountOptions={accountOptions}
          defaultValues={{
            name: "",
            kind: "loan",
            principal: "",
            apr: "",
            minimumPayment: "",
            accountId: null,
            startDate: new Date(),
            hasDeadline: false,
            targetDate: null,
            notes: null,
          }}
        />
      </SheetContent>
    </Sheet>
  );
};
