import { Area, AreaChart } from "recharts";

import { cn } from "@/lib/utils";

const WIDTH = 96;
const HEIGHT = 34;

type Props = {
  data: number[];
  color?: string;
  className?: string;
};

export const Sparkline = ({
  data,
  color = "var(--blue-700)",
  className,
}: Props) => {
  if (data.length < 2) return null;

  const points = data.map((value, index) => ({ index, value }));

  return (
    <div aria-hidden className={cn("shrink-0", className)}>
      <AreaChart
        width={WIDTH}
        height={HEIGHT}
        data={points}
        margin={{ top: 2, right: 0, bottom: 0, left: 0 }}
      >
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={color}
          fillOpacity={0.12}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </div>
  );
};
