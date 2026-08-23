"use client";

import { Suspense } from "react";
import { AlertTriangle, PiggyBank } from "lucide-react";

import { CardGridSkeleton } from "@/components/card-grid-skeleton";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { Filters } from "@/components/filters";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetBudgets } from "@/features/budgets/api/use-get-budgets";
import { BudgetCard } from "@/features/budgets/components/budget-card";
import { useNewBudget } from "@/features/budgets/hooks/use-new-budget";
import { useOpenBudget } from "@/features/budgets/hooks/use-open-budget";
import { PAGE_META } from "@/lib/routes";

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
  const overspent = budgets.filter((budget) => budget.status === "over").length;

  return (
    <div className="space-y-4">
      <PageHeader
        title={PAGE_META["/budgets"].title}
        description={PAGE_META["/budgets"].description}
        chips={
          budgets.length > 0
            ? [
                {
                  label: `${budgets.length} ${budgets.length === 1 ? "budget" : "budgets"}`,
                  icon: PiggyBank,
                },
                ...(overspent > 0
                  ? [
                      {
                        label: `${overspent} over limit`,
                        icon: AlertTriangle,
                      },
                    ]
                  : []),
              ]
            : undefined
        }
        filters={
          <Suspense fallback={<Skeleton className="h-7 w-64 rounded-full" />}>
            <Filters />
          </Suspense>
        }
      />

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
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
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
