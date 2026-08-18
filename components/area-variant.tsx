import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";

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

export const AreaVariant = ({ data }: Props) => {
  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <AreaChart data={data}>
        {chartGrid}
        <defs>
          <linearGradient id="income-fill" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="2%"
              stopColor={CHART_SERIES.income}
              stopOpacity={0.3}
            />
            <stop
              offset="98%"
              stopColor={CHART_SERIES.income}
              stopOpacity={0}
            />
          </linearGradient>
          <linearGradient id="expenses-fill" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="2%"
              stopColor={CHART_SERIES.expenses}
              stopOpacity={0.3}
            />
            <stop
              offset="98%"
              stopColor={CHART_SERIES.expenses}
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        {dateXAxis}
        <Tooltip content={<CashFlowTooltip />} />
        <Area
          type="monotone"
          dataKey="income"
          stackId="income"
          strokeWidth={2}
          stroke={CHART_SERIES.income}
          fill="url(#income-fill)"
        />
        <Area
          type="monotone"
          dataKey="expenses"
          stackId="expenses"
          strokeWidth={2}
          stroke={CHART_SERIES.expenses}
          fill="url(#expenses-fill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
