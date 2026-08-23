"use client";

import { CreditCard, PiggyBank, TrendingDown, TrendingUp } from "lucide-react";

import { DataCard } from "@/components/data-card";
import { StatGroup } from "@/components/stat-group";
import { formatCurrency } from "@/lib/utils";

type Props = {
  closingBalance: number;
  projectedChange: number;
  lowestPoint: { date: Date; balance: number } | null;
  upcomingIncome: number;
  upcomingExpenses: number;
  dateRange: string;
};

export const ForecastSummaryGrid = ({
  closingBalance,
  projectedChange,
  lowestPoint,
  upcomingIncome,
  upcomingExpenses,
  dateRange,
}: Props) => {
  const changeVariant = projectedChange < 0 ? "danger" : "success";

  return (
    <StatGroup caption={dateRange} columns={5}>
      <DataCard
        icon={CreditCard}
        title="Closing Balance"
        value={closingBalance}
        variant="default"
        subtitle="Projected at period end"
      />
      <DataCard
        icon={projectedChange < 0 ? TrendingDown : TrendingUp}
        title="Projected Change"
        value={projectedChange}
        variant={changeVariant}
        subtitle="From opening balance"
      />
      <DataCard
        icon={TrendingDown}
        title="Lowest Balance"
        value={lowestPoint?.balance ?? 0}
        variant={(lowestPoint?.balance ?? 0) < 0 ? "danger" : "warning"}
        subtitle={
          lowestPoint ? `Lowest projected point` : "No projected balance points"
        }
      />
      <DataCard
        icon={PiggyBank}
        title="Upcoming Income"
        value={upcomingIncome}
        variant="success"
        subtitle={`Planned inflow: ${formatCurrency(upcomingIncome)}`}
      />
      <DataCard
        icon={TrendingDown}
        title="Upcoming Expenses"
        value={upcomingExpenses}
        variant="danger"
        subtitle={`Planned outflow: ${formatCurrency(upcomingExpenses)}`}
      />
    </StatGroup>
  );
};
