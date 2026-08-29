"use client";

import { Landmark, Target } from "lucide-react";

import { DataCard, DataCardLoading } from "@/components/data-card";
import { ErrorState } from "@/components/error-state";
import { StatGroup } from "@/components/stat-group";
import { Card } from "@/components/ui/card";
import { useGetDebts } from "@/features/debts/api/use-get-debts";
import { useGetGoals } from "@/features/goals/api/use-get-goals";
import { payoffPercentage } from "@/lib/debts";
import { goalPercentage } from "@/lib/goals";
import { formatCurrency, formatPercentage } from "@/lib/utils";

export const PositionGrid = () => {
  const goalsQuery = useGetGoals();
  const debtsQuery = useGetDebts();

  if (goalsQuery.isLoading || debtsQuery.isLoading) {
    return (
      <StatGroup columns={2} className="mb-4">
        <DataCardLoading />
        <DataCardLoading />
      </StatGroup>
    );
  }

  if (goalsQuery.isError || debtsQuery.isError) {
    return (
      <Card className="mb-4 px-5">
        <ErrorState
          compact
          onRetry={() => {
            goalsQuery.refetch();
            debtsQuery.refetch();
          }}
        />
      </Card>
    );
  }

  const goals = goalsQuery.data ?? [];
  const debts = debtsQuery.data ?? [];

  if (goals.length === 0 && debts.length === 0) return null;

  const savedTotal = goals.reduce((total, goal) => total + goal.saved, 0);
  const targetTotal = goals.reduce(
    (total, goal) => total + goal.targetAmount,
    0
  );
  const savedPercentage = goalPercentage(savedTotal, targetTotal);

  const owedTotal = debts.reduce((total, debt) => total + debt.balance, 0);
  const principalTotal = debts.reduce(
    (total, debt) => total + debt.principal,
    0
  );
  const paidTotal = debts.reduce((total, debt) => total + debt.paid, 0);
  const clearedPercentage = payoffPercentage(paidTotal, principalTotal);

  return (
    <StatGroup caption="As of today" columns={2} className="mb-4">
      <DataCard
        title="Saved Toward Goals"
        value={savedTotal}
        subtitle={
          goals.length === 0
            ? "No goals yet"
            : `${formatPercentage(savedPercentage)} of ${formatCurrency(targetTotal)} target`
        }
        icon={Target}
      />
      <DataCard
        title="Total Owed"
        value={owedTotal}
        subtitle={
          debts.length === 0
            ? "No debts yet"
            : `${formatPercentage(clearedPercentage)} cleared of ${formatCurrency(principalTotal)} borrowed`
        }
        icon={Landmark}
        variant={owedTotal > 0 ? "warning" : "success"}
      />
    </StatGroup>
  );
};
