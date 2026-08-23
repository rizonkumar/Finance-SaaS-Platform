"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useGetAccounts } from "@/features/accounts/api/use-get-accounts";
import { useCreateHolding } from "@/features/holdings/api/use-create-holding";
import {
  HoldingForm,
  type HoldingApiValues,
} from "@/features/holdings/components/holding-form";
import { useNewHolding } from "@/features/holdings/hooks/use-new-holding";
import { INVESTMENT_ACCOUNT_TYPES } from "@/lib/net-worth";

export const NewHoldingSheet = () => {
  const { isOpen, onClose } = useNewHolding();

  const createMutation = useCreateHolding();
  const accountsQuery = useGetAccounts();

  const accountOptions = (accountsQuery.data ?? [])
    .filter((account) => INVESTMENT_ACCOUNT_TYPES.includes(account.type))
    .map((account) => ({ label: account.name, value: account.id }));

  const onSubmit = (values: HoldingApiValues) => {
    createMutation.mutate(values, { onSuccess: () => onClose() });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="space-y-4 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New Holding</SheetTitle>
          <SheetDescription>
            Track a stock or fund you own inside a broker account.
          </SheetDescription>
        </SheetHeader>
        <HoldingForm
          onSubmit={onSubmit}
          disabled={createMutation.isPending || accountsQuery.isLoading}
          isSubmitting={createMutation.isPending}
          accountOptions={accountOptions}
        />
      </SheetContent>
    </Sheet>
  );
};
