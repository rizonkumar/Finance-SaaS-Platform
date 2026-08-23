"use client";

import { useIsMounted } from "@/hooks/use-is-mounted";
import { EditAccountSheet } from "@/features/accounts/components/edit-account-sheet";
import { NewAccountSheet } from "@/features/accounts/components/new-account-sheet";
import { EditBudgetSheet } from "@/features/budgets/components/edit-budget-sheet";
import { NewBudgetSheet } from "@/features/budgets/components/new-budget-sheet";
import { EditDebtSheet } from "@/features/debts/components/edit-debt-sheet";
import { NewDebtSheet } from "@/features/debts/components/new-debt-sheet";
import { PayDebtSheet } from "@/features/debts/components/pay-debt-sheet";
import { ContributeGoalSheet } from "@/features/goals/components/contribute-goal-sheet";
import { EditHoldingSheet } from "@/features/holdings/components/edit-holding-sheet";
import { NewHoldingSheet } from "@/features/holdings/components/new-holding-sheet";
import { TradeHoldingSheet } from "@/features/holdings/components/trade-holding-sheet";
import { EditGoalSheet } from "@/features/goals/components/edit-goal-sheet";
import { NewGoalSheet } from "@/features/goals/components/new-goal-sheet";
import { EditCategorySheet } from "@/features/categories/components/edit-category-sheet";
import { NewCategorySheet } from "@/features/categories/components/new-category-sheet";
import { EditRecurringSheet } from "@/features/recurring/components/edit-recurring-sheet";
import { NewRecurringSheet } from "@/features/recurring/components/new-recurring-sheet";
import { EditTransactionSheet } from "@/features/transactions/components/edit-transaction-sheet";
import { NewTransactionSheet } from "@/features/transactions/components/new-transaction-sheet";
import { EditTransferSheet } from "@/features/transfers/components/edit-transfer-sheet";
import { NewTransferSheet } from "@/features/transfers/components/new-transfer-sheet";

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

      <NewTransferSheet />
      <EditTransferSheet />

      <NewBudgetSheet />
      <EditBudgetSheet />

      <NewRecurringSheet />
      <EditRecurringSheet />

      <NewHoldingSheet />
      <EditHoldingSheet />
      <TradeHoldingSheet />

      <NewGoalSheet />
      <EditGoalSheet />
      <ContributeGoalSheet />

      <NewDebtSheet />
      <EditDebtSheet />
      <PayDebtSheet />
    </>
  );
};
