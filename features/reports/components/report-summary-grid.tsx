import { PiggyBank, Scale, TrendingDown, TrendingUp } from "lucide-react";

import { DataCard } from "@/components/data-card";
import { StatGroup } from "@/components/stat-group";
import { type ReportData } from "@/features/reports/api/use-get-reports";
import { formatPercentage } from "@/lib/utils";

type Props = {
  totals: ReportData["totals"];
  caption: string;
};

export const ReportSummaryGrid = ({ totals, caption }: Props) => (
  <StatGroup caption={caption} columns={4}>
    <DataCard
      icon={TrendingUp}
      title="Income"
      value={totals.income}
      variant="success"
      subtitle="Money in, excluding transfers"
    />
    <DataCard
      icon={TrendingDown}
      title="Spending"
      value={totals.expenses}
      variant="danger"
      subtitle="Money out, excluding transfers"
    />
    <DataCard
      icon={Scale}
      title="Net saved"
      value={totals.net}
      variant={totals.net < 0 ? "danger" : "default"}
      subtitle="Income minus spending"
    />
    <DataCard
      icon={PiggyBank}
      title="Savings rate"
      value={totals.savingsRate}
      variant={totals.savingsRate < 0 ? "danger" : "warning"}
      formatValue={formatPercentage}
      subtitle="Share of income you kept"
    />
  </StatGroup>
);
