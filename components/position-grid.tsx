"use client";

import { Landmark, Target } from "lucide-react";

import { DataCard, DataCardLoading } from "@/components/data-card";
import { useGetDebts } from "@/features/debts/api/use-get-debts";
import { useGetGoals } from "@/features/goals/api/use-get-goals";
import { payoffPercentage } from "@/lib/debts";
import { goalPercentage } from "@/lib/goals";
import { formatCurrency, formatPercentage } from "@/lib/utils";

const GRID = "mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2";

export const PositionGrid = () => {
  const goalsQuery = useGetGoals();
  const debtsQuery = useGetDebts();

  if (goalsQuery.isLoading || debtsQuery.isLoading) {
    return (
      <div className={GRID}>
        <DataCardLoading />
        <DataCardLoading />
      </div>
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
    <div className={GRID}>
      <DataCard
        title="Saved Toward Goals"
        value={savedTotal}
        dateRange="As of today"
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
        dateRange="As of today"
        subtitle={
          debts.length === 0
            ? "No debts yet"
            : `${formatPercentage(clearedPercentage)} cleared of ${formatCurrency(principalTotal)} borrowed`
        }
        icon={Landmark}
        variant={owedTotal > 0 ? "warning" : "success"}
      />
    </div>
  );
};
