"use client";

import { Landmark, Plus } from "lucide-react";

import { CardGridSkeleton } from "@/components/card-grid-skeleton";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
      <div className="flex items-center justify-between gap-x-2">
        <p className="copy-14 text-gray-900">
          {debts.length} {debts.length === 1 ? "debt" : "debts"}
          {debts.length > 0 && (
            <>
              {" · "}
              <span className="numeric">{formatCurrency(owed)}</span> still owed
              of <span className="numeric">{formatCurrency(borrowed)}</span>
            </>
          )}
        </p>
        <Button size="sm" onClick={newDebt.onOpen}>
          <Plus className="size-4" />
          Add Debt
        </Button>
      </div>

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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
