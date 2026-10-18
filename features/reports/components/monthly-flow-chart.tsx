import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { chartGrid } from "@/components/chart-axis";
import { ChartTooltip } from "@/components/chart-tooltip";
import { type ReportData } from "@/features/reports/api/use-get-reports";
import { CHART_HEIGHT, CHART_SERIES } from "@/lib/constants";
import { formatMonthLabel } from "@/lib/reports";

type Flow = ReportData["monthly"][number];

type TooltipProps = {
  active?: boolean;
  payload?: { payload?: Flow }[];
};

const MonthlyFlowTooltip = ({ active, payload }: TooltipProps) => {
  const flow = payload?.at(0)?.payload;

  if (!active || !flow) return null;

  return (
    <ChartTooltip
      heading={formatMonthLabel(flow.month)}
      rows={[
        { label: "Income", value: flow.income, tone: "income" },
        { label: "Spending", value: -flow.expenses, tone: "expense" },
        { label: "Net", value: flow.net, tone: "net" },
      ]}
    />
  );
};

type Props = {
  data: Flow[];
};

export const MonthlyFlowChart = ({ data }: Props) => (
  <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
    <BarChart data={data}>
      {chartGrid}
      <XAxis
        axisLine={false}
        tickLine={false}
        dataKey="month"
        tickFormatter={formatMonthLabel}
        tick={{ fill: "var(--gray-800)", fontSize: 12 }}
        tickMargin={12}
      />
      <Tooltip
        content={<MonthlyFlowTooltip />}
        cursor={{ fill: "var(--gray-alpha-100)" }}
      />
      <Bar dataKey="income" fill={CHART_SERIES.income} radius={[4, 4, 0, 0]} />
      <Bar
        dataKey="expenses"
        fill={CHART_SERIES.expenses}
        radius={[4, 4, 0, 0]}
      />
    </BarChart>
  </ResponsiveContainer>
);
