"use client";

import { PiggyBank, TrendingDown, TrendingUp } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { DataCard, DataCardLoading } from "@/components/data-card";
import { StatGroup } from "@/components/stat-group";
import { useGetSummary } from "@/features/summary/api/use-get-summary";
import { formatDateRange } from "@/lib/utils";

export const DataGrid = () => {
  const { data, isLoading } = useGetSummary();

  const params = useSearchParams();
  const to = params.get("to") || undefined;
  const from = params.get("from") || undefined;

  const dateRangeLabel = formatDateRange({ to, from });

  if (isLoading) {
    return (
      <StatGroup className="mb-4">
        <DataCardLoading />
        <DataCardLoading />
        <DataCardLoading />
      </StatGroup>
    );
  }

  const days = data?.days ?? [];

  return (
    <StatGroup caption={dateRangeLabel} className="mb-4">
      <DataCard
        title="Remaining"
        value={data?.remainingAmount}
        percentageChange={data?.remainingChange}
        icon={PiggyBank}
        trend={days.map((day) => day.income - day.expenses)}
      />
      <DataCard
        title="Income"
        value={data?.incomeAmount}
        percentageChange={data?.incomeChange}
        icon={TrendingUp}
        variant="success"
        trend={days.map((day) => day.income)}
      />
      <DataCard
        title="Expenses"
        value={data?.expensesAmount}
        percentageChange={data?.expensesChange}
        icon={TrendingDown}
        variant="danger"
        trend={days.map((day) => day.expenses)}
      />
    </StatGroup>
  );
};
