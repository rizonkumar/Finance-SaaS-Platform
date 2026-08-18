"use client";

import { useIsMounted } from "@/hooks/use-is-mounted";
import { EditAccountSheet } from "@/features/accounts/components/edit-account-sheet";
import { NewAccountSheet } from "@/features/accounts/components/new-account-sheet";
import { EditBudgetSheet } from "@/features/budgets/components/edit-budget-sheet";
import { NewBudgetSheet } from "@/features/budgets/components/new-budget-sheet";
import { EditCategorySheet } from "@/features/categories/components/edit-category-sheet";
import { NewCategorySheet } from "@/features/categories/components/new-category-sheet";
import { EditRecurringSheet } from "@/features/recurring/components/edit-recurring-sheet";
import { NewRecurringSheet } from "@/features/recurring/components/new-recurring-sheet";
import { EditTransactionSheet } from "@/features/transactions/components/edit-transaction-sheet";
import { NewTransactionSheet } from "@/features/transactions/components/new-transaction-sheet";

export const SheetProvider = () => {
  const isMounted = useIsMounted();

  if (!isMounted) return null;

  return (
    <>
      <NewAccountSheet />
      <EditAccountSheet />

      <NewCategorySheet />
      <EditCategorySheet />

      <NewTransactionSheet />
      <EditTransactionSheet />

      <NewBudgetSheet />
      <EditBudgetSheet />

      <NewRecurringSheet />
      <EditRecurringSheet />
    </>
  );
};
