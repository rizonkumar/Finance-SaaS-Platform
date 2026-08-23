"use client";

import { LineChart, TrendingDown, TrendingUp, Wallet } from "lucide-react";

import { DataCard } from "@/components/data-card";
import { StatGroup } from "@/components/stat-group";
import { formatCurrency } from "@/lib/utils";

export type PortfolioTotals = {
  invested: number;
  value: number;
  unrealised: number;
  realised: number;
};

type Props = {
  totals: PortfolioTotals;
};

export const portfolioTotals = (
  holdings: { costBasis: number; marketValue: number; realisedGain: number }[]
): PortfolioTotals => {
  const invested = holdings.reduce((total, row) => total + row.costBasis, 0);
  const value = holdings.reduce((total, row) => total + row.marketValue, 0);

  return {
    invested,
    value,
    unrealised: value - invested,
    realised: holdings.reduce((total, row) => total + row.realisedGain, 0),
  };
};

export const PortfolioSummary = ({ totals }: Props) => {
  const losing = totals.unrealised < 0;
  const tone = losing ? "danger" : "success";

  return (
    <StatGroup caption="At the prices you last recorded">
      <DataCard
        title="Invested"
        value={totals.invested}
        subtitle="Cost of what you still hold"
        icon={Wallet}
      />
      <DataCard
        title="Market Value"
        value={totals.value}
        subtitle="At your latest prices"
        icon={LineChart}
        variant={tone}
      />
      <DataCard
        title="Unrealised"
        value={totals.unrealised}
        subtitle={
          totals.invested > 0
            ? `Against ${formatCurrency(totals.invested)} invested`
            : "Nothing invested yet"
        }
        icon={losing ? TrendingDown : TrendingUp}
        variant={tone}
      />
    </StatGroup>
  );
};
