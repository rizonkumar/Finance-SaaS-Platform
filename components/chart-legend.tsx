type LegendEntry = {
  value?: string;
  color?: string;
  payload?: { percent?: number; value?: number };
};

type Props = {
  payload?: readonly LegendEntry[];
  formatValue: (entry: LegendEntry) => string;
};

export const ChartLegend = ({ payload, formatValue }: Props) => {
  if (!payload) return null;

  return (
    <ul className="flex flex-col gap-y-2">
      {payload.map((entry) => (
        <li key={entry.value} className="flex items-center gap-x-2">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="label-13 text-gray-900">{entry.value}</span>
          <span className="numeric text-gray-1000 text-xs font-medium">
            {formatValue(entry)}
          </span>
        </li>
      ))}
    </ul>
  );
};
