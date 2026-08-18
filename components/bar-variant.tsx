import { Bar, BarChart, ResponsiveContainer, Tooltip } from "recharts";

import { chartGrid, dateXAxis } from "@/components/chart-axis";
import { CashFlowTooltip } from "@/components/chart-tooltip";
import { CHART_HEIGHT, CHART_SERIES } from "@/lib/constants";

type Props = {
  data: {
    date: string;
    income: number;
    expenses: number;
  }[];
};

export const BarVariant = ({ data }: Props) => {
  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <BarChart data={data}>
        {chartGrid}
        {dateXAxis}
        <Tooltip
          content={<CashFlowTooltip />}
          cursor={{ fill: "var(--gray-alpha-100)" }}
        />
        <Bar
          dataKey="income"
          fill={CHART_SERIES.income}
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="expenses"
          fill={CHART_SERIES.expenses}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};
