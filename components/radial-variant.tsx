import {
  Legend,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from "recharts";

import { ChartLegend } from "@/components/chart-legend";
import { CHART_CATEGORY_COLORS, CHART_HEIGHT } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

type Props = {
  data: {
    name: string;
    value: number;
  }[];
};

export const RadialVariant = ({ data }: Props) => {
  const series = data.map((item, index) => ({
    ...item,
    fill: CHART_CATEGORY_COLORS[index % CHART_CATEGORY_COLORS.length],
  }));

  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <RadialBarChart
        cx="50%"
        cy="30%"
        barSize={10}
        innerRadius="90%"
        outerRadius="40%"
        data={series}
      >
        <RadialBar
          label={{
            position: "insideStart",
            fill: "var(--background-200)",
            fontSize: 12,
          }}
          background={{ fill: "var(--gray-alpha-200)" }}
          dataKey="value"
        />
        <Legend
          layout="horizontal"
          verticalAlign="bottom"
          align="right"
          iconType="circle"
          content={({ payload }) => (
            <ChartLegend
              payload={payload}
              formatValue={(entry) => formatCurrency(entry.payload?.value ?? 0)}
            />
          )}
        />
      </RadialBarChart>
    </ResponsiveContainer>
  );
};
