"use client";

import { CreditCard, PiggyBank, TrendingDown, TrendingUp } from "lucide-react";

import { DataCard } from "@/components/data-card";
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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      <DataCard
        icon={CreditCard}
        title="Closing Balance"
        value={closingBalance}
        dateRange={dateRange}
        variant="default"
        subtitle="Projected at period end"
      />
      <DataCard
        icon={projectedChange < 0 ? TrendingDown : TrendingUp}
        title="Projected Change"
        value={projectedChange}
        dateRange={dateRange}
        variant={changeVariant}
        subtitle="From opening balance"
      />
      <DataCard
        icon={TrendingDown}
        title="Lowest Balance"
        value={lowestPoint?.balance ?? 0}
        dateRange={dateRange}
        variant={(lowestPoint?.balance ?? 0) < 0 ? "danger" : "warning"}
        subtitle={
          lowestPoint ? `Lowest projected point` : "No projected balance points"
        }
      />
      <DataCard
        icon={PiggyBank}
        title="Upcoming Income"
        value={upcomingIncome}
        dateRange={dateRange}
        variant="success"
        subtitle={`Planned inflow: ${formatCurrency(upcomingIncome)}`}
      />
      <DataCard
        icon={TrendingDown}
        title="Upcoming Expenses"
        value={upcomingExpenses}
        dateRange={dateRange}
        variant="danger"
        subtitle={`Planned outflow: ${formatCurrency(upcomingExpenses)}`}
      />
    </div>
  );
};
