import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useGetAccounts } from "@/features/accounts/api/use-get-accounts";
import { useCreateTransfer } from "@/features/transfers/api/use-create-transfer";
import {
  TransferForm,
  type TransferApiValues,
} from "@/features/transfers/components/transfer-form";
import { useNewTransfer } from "@/features/transfers/hooks/use-new-transfer";

export const NewTransferSheet = () => {
  const { isOpen, onClose } = useNewTransfer();

  const mutation = useCreateTransfer();
  const accountsQuery = useGetAccounts();

  const accountOptions = (accountsQuery.data ?? []).map((account) => ({
    label: account.name,
    value: account.id,
  }));

  const onSubmit = (values: TransferApiValues) => {
    mutation.mutate(values, { onSuccess: onClose });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>New Transfer</SheetTitle>
          <SheetDescription>
            Move money between two of your own accounts.
          </SheetDescription>
        </SheetHeader>
        <TransferForm
          onSubmit={onSubmit}
          disabled={mutation.isPending || accountsQuery.isLoading}
          isSubmitting={mutation.isPending}
          accountOptions={accountOptions}
          defaultValues={{
            date: new Date(),
            amount: "",
            fromAccountId: "",
            toAccountId: "",
            notes: null,
          }}
        />
      </SheetContent>
    </Sheet>
  );
};
