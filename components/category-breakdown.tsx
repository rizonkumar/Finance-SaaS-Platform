import { CHART_HEIGHT } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

const MAX_ROWS = 6;

type Props = {
  data: {
    name: string;
    value: number;
  }[];
};

export const CategoryBreakdown = ({ data }: Props) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const rows = data.slice(0, MAX_ROWS);
  const largest = Math.max(...rows.map((item) => item.value), 0);

  return (
    <ul
      className="flex flex-col justify-between"
      style={{ minHeight: CHART_HEIGHT }}
    >
      {rows.map((item) => {
        const share = total > 0 ? (item.value / total) * 100 : 0;
        const relative = largest > 0 ? (item.value / largest) * 100 : 0;

        return (
          <li key={item.name} className="flex items-center gap-x-3">
            <span className="copy-13 text-gray-1000 w-24 shrink-0 truncate">
              {item.name}
            </span>
            <div
              role="progressbar"
              aria-label={`${item.name} share of spending`}
              aria-valuenow={Math.round(share)}
              aria-valuemin={0}
              aria-valuemax={100}
              className="bg-alpha-200 h-1.5 min-w-0 flex-1 overflow-hidden rounded-full"
            >
              <div
                className="h-full rounded-full bg-blue-700 transition-all"
                style={{ width: `${relative}%` }}
              />
            </div>
            <span className="numeric copy-13 text-gray-1000 shrink-0 text-right">
              {formatCurrency(item.value)}
            </span>
            <span className="numeric copy-13 w-9 shrink-0 text-right text-gray-900">
              {Math.round(share)}%
            </span>
          </li>
        );
      })}
    </ul>
  );
};
