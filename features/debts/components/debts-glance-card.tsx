"use client";

import { Landmark } from "lucide-react";

import { GlanceCard } from "@/components/glance-card";
import { useGetDebts } from "@/features/debts/api/use-get-debts";
import { DEBT_FILL_TONE } from "@/features/debts/components/payoff-progress";
import { formatCurrency } from "@/lib/utils";

export const DebtsGlanceCard = () => {
  const debtsQuery = useGetDebts();
  const debts = debtsQuery.data ?? [];

  const items = debts.map((debt) => ({
    id: debt.id,
    title: debt.name,
    amountLabel: `${formatCurrency(debt.balance)} left`,
    percentage: debt.percentage,
    fillClassName: DEBT_FILL_TONE[debt.status],
  }));

  return (
    <GlanceCard
      title="Debts"
      href="/debts"
      items={items}
      isLoading={debtsQuery.isLoading}
      isError={debtsQuery.isError}
      onRetry={() => debtsQuery.refetch()}
      emptyIcon={Landmark}
      emptyTitle="No debts yet"
      emptyDescription="Track a loan or card to see it clear over time."
    />
  );
};
