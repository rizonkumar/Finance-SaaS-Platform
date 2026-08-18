import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";

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

export const LineVariant = ({ data }: Props) => {
  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <LineChart data={data}>
        {chartGrid}
        {dateXAxis}
        <Tooltip content={<CashFlowTooltip />} />
        <Line
          dot={false}
          dataKey="income"
          stroke={CHART_SERIES.income}
          strokeWidth={2}
        />
        <Line
          dot={false}
          dataKey="expenses"
          stroke={CHART_SERIES.expenses}
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
