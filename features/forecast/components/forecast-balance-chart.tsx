"use client";

import {
  Area,
  AreaChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { chartGrid, dateXAxis } from "@/components/chart-axis";
import { ChartLegend } from "@/components/chart-legend";
import { ForecastTooltip } from "@/components/chart-tooltip";
import { CHART_HEIGHT, NET_WORTH_SERIES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

export type ForecastDay = {
  date: Date;
  balance: number;
  income: number;
  expenses: number;
};

type Props = {
  data: ForecastDay[];
};

export const ForecastBalanceChart = ({ data }: Props) => {
  const closing = data.at(-1)?.balance ?? 0;

  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <AreaChart data={data}>
        {chartGrid}
        <defs>
          <linearGradient
            id="forecast-balance-fill"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="2%"
              stopColor={NET_WORTH_SERIES.netWorth}
              stopOpacity={0.28}
            />
            <stop
              offset="98%"
              stopColor={NET_WORTH_SERIES.netWorth}
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        {dateXAxis}
        <Tooltip content={<ForecastTooltip />} />
        <Legend
          verticalAlign="top"
          align="left"
          content={({ payload }) => (
            <ChartLegend
              payload={payload}
              orientation="horizontal"
              formatValue={() => formatCurrency(closing)}
            />
          )}
        />
        <Area
          type="monotone"
          dot={false}
          name="Projected balance"
          dataKey="balance"
          stroke={NET_WORTH_SERIES.netWorth}
          strokeWidth={2}
          fill="url(#forecast-balance-fill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
