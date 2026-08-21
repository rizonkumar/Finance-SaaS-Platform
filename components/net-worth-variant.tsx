import {
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { chartGrid, dateXAxis } from "@/components/chart-axis";
import { ChartLegend } from "@/components/chart-legend";
import { NetWorthTooltip } from "@/components/chart-tooltip";
import { CHART_HEIGHT, NET_WORTH_SERIES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

export type NetWorthDay = {
  date: string;
  assets: number;
  liabilities: number;
  netWorth: number;
};

const SERIES = [
  {
    key: "netWorth",
    name: "Net worth",
    color: NET_WORTH_SERIES.netWorth,
    width: 2,
  },
  { key: "assets", name: "Assets", color: NET_WORTH_SERIES.assets, width: 1.5 },
  {
    key: "liabilities",
    name: "Liabilities",
    color: NET_WORTH_SERIES.liabilities,
    width: 1.5,
  },
] as const;

type Props = {
  data: NetWorthDay[];
};

export const NetWorthVariant = ({ data }: Props) => {
  const closing = data.at(-1);

  const closingByName = new Map<string, number>(
    SERIES.map((series) => [series.name, closing?.[series.key] ?? 0])
  );

  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <LineChart data={data}>
        {chartGrid}
        {dateXAxis}
        <Tooltip content={<NetWorthTooltip />} />
        <Legend
          verticalAlign="top"
          align="left"
          content={({ payload }) => (
            <ChartLegend
              payload={payload}
              orientation="horizontal"
              formatValue={(entry) =>
                formatCurrency(closingByName.get(entry.value ?? "") ?? 0)
              }
            />
          )}
        />
        {SERIES.map((series) => (
          <Line
            key={series.key}
            dot={false}
            name={series.name}
            dataKey={series.key}
            stroke={series.color}
            strokeWidth={series.width}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};
