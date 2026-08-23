"use client";

import { Landmark, Plus, TrendingDown } from "lucide-react";

import { CardGridSkeleton } from "@/components/card-grid-skeleton";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PAGE_META } from "@/lib/routes";
import { useGetDebts } from "@/features/debts/api/use-get-debts";
import { DebtCard } from "@/features/debts/components/debt-card";
import { PayoffPlanCard } from "@/features/debts/components/payoff-plan-card";
import { useNewDebt } from "@/features/debts/hooks/use-new-debt";
import { useOpenDebt } from "@/features/debts/hooks/use-open-debt";
import { usePayDebt } from "@/features/debts/hooks/use-pay-debt";
import { formatCurrency } from "@/lib/utils";

const DebtsPage = () => {
  const newDebt = useNewDebt();
  const openDebt = useOpenDebt();
  const payDebt = usePayDebt();
  const debtsQuery = useGetDebts();

  if (debtsQuery.isLoading) {
    return <CardGridSkeleton />;
  }

  if (debtsQuery.isError) {
    return (
      <Card>
        <CardContent>
          <ErrorState onRetry={() => debtsQuery.refetch()} />
        </CardContent>
      </Card>
    );
  }

  const debts = debtsQuery.data ?? [];
  const owed = debts.reduce((total, debt) => total + debt.balance, 0);
  const borrowed = debts.reduce((total, debt) => total + debt.principal, 0);
  const hasOutstanding = debts.some((debt) => debt.balance > 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title={PAGE_META["/debts"].title}
        description={PAGE_META["/debts"].description}
        chips={
          debts.length > 0
            ? [
                {
                  label: `${debts.length} ${debts.length === 1 ? "debt" : "debts"}`,
                  icon: Landmark,
                },
                {
                  label: `${formatCurrency(owed)} owed of ${formatCurrency(borrowed)}`,
                  icon: TrendingDown,
                },
              ]
            : undefined
        }
        actions={
          <Button size="sm" onClick={newDebt.onOpen}>
            <Plus className="size-4" />
            Add Debt
          </Button>
        }
      />

      {debts.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Landmark}
              title="No debts yet"
              description="Add a loan or a card to see when it clears at your current payment, and what an extra payment each month would buy you."
              actionLabel="Add Debt"
              onAction={newDebt.onOpen}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {debts.map((debt) => (
              <DebtCard
                key={debt.id}
                {...debt}
                onEdit={openDebt.onOpen}
                onPay={payDebt.onOpen}
              />
            ))}
          </div>
          {hasOutstanding && <PayoffPlanCard />}
        </>
      )}
    </div>
  );
};

export default DebtsPage;
