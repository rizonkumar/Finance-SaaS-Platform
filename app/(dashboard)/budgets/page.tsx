"use client";

import { PiggyBank, Plus } from "lucide-react";

import { CardGridSkeleton } from "@/components/card-grid-skeleton";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGetBudgets } from "@/features/budgets/api/use-get-budgets";
import { BudgetCard } from "@/features/budgets/components/budget-card";
import { useNewBudget } from "@/features/budgets/hooks/use-new-budget";
import { useOpenBudget } from "@/features/budgets/hooks/use-open-budget";

const BudgetsPage = () => {
  const newBudget = useNewBudget();
  const openBudget = useOpenBudget();
  const budgetsQuery = useGetBudgets();

  if (budgetsQuery.isLoading) {
    return <CardGridSkeleton />;
  }

  if (budgetsQuery.isError) {
    return (
      <Card>
        <CardContent>
          <ErrorState onRetry={() => budgetsQuery.refetch()} />
        </CardContent>
      </Card>
    );
  }

  const budgets = budgetsQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-x-2">
        <p className="copy-14 text-gray-900">
          {budgets.length} {budgets.length === 1 ? "budget" : "budgets"}
        </p>
        <Button size="sm" onClick={newBudget.onOpen}>
          <Plus className="size-4" />
          Add Budget
        </Button>
      </div>

      {budgets.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={PiggyBank}
              title="No budgets yet"
              description="Set a monthly limit for a category and track how much of it you have used."
              actionLabel="Add Budget"
              onAction={newBudget.onOpen}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              {...budget}
              onEdit={openBudget.onOpen}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BudgetsPage;
