import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

import { CHART_HEIGHT } from "@/lib/constants";

type Props = {
  data?: {
    name: string;
    value: number;
  }[];
};

export const RadarVariant = ({ data }: Props) => {
  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <RadarChart cx="50%" cy="50%" outerRadius="60%" data={data}>
        <PolarGrid stroke="var(--gray-alpha-300)" />
        <PolarAngleAxis
          dataKey="name"
          tick={{ fill: "var(--gray-800)", fontSize: 12 }}
        />
        <PolarRadiusAxis tick={{ fill: "var(--gray-700)", fontSize: 11 }} />
        <Radar
          dataKey="value"
          stroke="var(--chart-1)"
          fill="var(--chart-1)"
          fillOpacity={0.4}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};
