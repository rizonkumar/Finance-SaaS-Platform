import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { ChartLegend } from "@/components/chart-legend";
import { CategoryTooltip } from "@/components/chart-tooltip";
import { CHART_CATEGORY_COLORS, CHART_HEIGHT } from "@/lib/constants";
import { formatPercentage } from "@/lib/utils";

type Props = {
  data: {
    name: string;
    value: number;
  }[];
};

export const PieVariant = ({ data }: Props) => {
  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <PieChart>
        <Legend
          layout="horizontal"
          verticalAlign="bottom"
          align="right"
          iconType="circle"
          content={({ payload }) => (
            <ChartLegend
              payload={payload}
              formatValue={(entry) =>
                formatPercentage((entry.payload?.percent ?? 0) * 100)
              }
            />
          )}
        />
        <Tooltip content={<CategoryTooltip />} />
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={90}
          innerRadius={60}
          paddingAngle={2}
          dataKey="value"
          labelLine={false}
          stroke="var(--background-200)"
          strokeWidth={2}
        >
          {data.map((entry, index) => (
            <Cell
              key={entry.name}
              fill={CHART_CATEGORY_COLORS[index % CHART_CATEGORY_COLORS.length]}
            />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};
