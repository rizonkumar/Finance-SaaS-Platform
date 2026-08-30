"use client";

import { Landmark, TrendingDown } from "lucide-react";

import { CardGridSkeleton } from "@/components/card-grid-skeleton";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { PAGE_META } from "@/lib/routes";
import { useGetDebts } from "@/features/debts/api/use-get-debts";
import { DebtCard } from "@/features/debts/components/debt-card";
import { PayoffPlanCard } from "@/features/debts/components/payoff-plan-card";
import { useNewDebt } from "@/features/debts/hooks/use-new-debt";
import { useOpenDebt } from "@/features/debts/hooks/use-open-debt";
import { usePayDebt } from "@/features/debts/hooks/use-pay-debt";
import { debtSchedulePrefill } from "@/features/recurring/debt-prefill";
import { useNewRecurring } from "@/features/recurring/hooks/use-new-recurring";
import { useOpenRecurring } from "@/features/recurring/hooks/use-open-recurring";
import { formatCurrency } from "@/lib/utils";

const DebtsPage = () => {
  const newDebt = useNewDebt();
  const openDebt = useOpenDebt();
  const payDebt = usePayDebt();
  const newRecurring = useNewRecurring();
  const openRecurring = useOpenRecurring();
  const debtsQuery = useGetDebts();

  const debts = debtsQuery.data ?? [];

  const onAutomate = (id: string) => {
    const debt = debts.find((row) => row.id === id);

    if (debt) newRecurring.onOpen(debtSchedulePrefill(debt));
  };

  const owed = debts.reduce((total, debt) => total + debt.balance, 0);
  const borrowed = debts.reduce((total, debt) => total + debt.principal, 0);
  const hasOutstanding = debts.some((debt) => debt.balance > 0);

  const renderBody = () => {
    if (debtsQuery.isLoading) return <CardGridSkeleton />;

    if (debtsQuery.isError) {
      return (
        <Card>
          <CardContent className="pt-5">
            <ErrorState onRetry={() => debtsQuery.refetch()} />
          </CardContent>
        </Card>
      );
    }

    if (debts.length === 0) {
      return (
        <Card>
          <CardContent className="pt-5">
            <EmptyState
              icon={Landmark}
              title="No debts yet"
              description="Add a loan or a card to see when it clears at your current payment, and what an extra payment each month would buy you."
              actionLabel="Add debt"
              onAction={newDebt.onOpen}
            />
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {debts.map((debt) => (
            <DebtCard
              key={debt.id}
              {...debt}
              onEdit={openDebt.onOpen}
              onPay={payDebt.onOpen}
              onAutomate={onAutomate}
              onManageSchedule={openRecurring.onOpen}
            />
          ))}
        </div>
        {hasOutstanding && <PayoffPlanCard />}
      </>
    );
  };

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
      />

      {renderBody()}
    </div>
  );
};

export default DebtsPage;
