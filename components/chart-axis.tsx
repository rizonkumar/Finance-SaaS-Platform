import { format } from "date-fns";
import { CartesianGrid, XAxis } from "recharts";

export const chartGrid = (
  <CartesianGrid
    strokeDasharray="3 3"
    stroke="var(--gray-alpha-200)"
    vertical={false}
  />
);

export const dateXAxis = (
  <XAxis
    axisLine={false}
    tickLine={false}
    dataKey="date"
    tickFormatter={(value) => format(value, "dd MMM")}
    tick={{ fill: "var(--gray-800)", fontSize: 12 }}
    tickMargin={12}
  />
);
