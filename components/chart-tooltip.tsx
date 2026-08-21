import { format } from "date-fns";

import { Separator } from "@/components/ui/separator";
import { DISPLAY_DATE_FORMAT } from "@/lib/constants";
import { cn, formatCurrency } from "@/lib/utils";

type TooltipTone = "income" | "expense" | "net";

type TooltipRow = {
  label: string;
  value: number;
  tone: TooltipTone;
};

type Props = {
  heading: string;
  rows: TooltipRow[];
};

const TONE_DOT: Record<TooltipTone, string> = {
  income: "bg-chart-2",
  expense: "bg-chart-3",
  net: "bg-chart-1",
};

export const ChartTooltip = ({ heading, rows }: Props) => {
  return (
    <div className="bg-surface shadow-popover overflow-hidden rounded-sm border">
      <div className="label-13 bg-gray-100 px-3 py-2 text-gray-900">
        {heading}
      </div>
      <Separator />
      <div className="space-y-1.5 px-3 py-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-x-6"
          >
            <div className="flex items-center gap-x-2">
              <span
                className={cn("size-1.5 rounded-full", TONE_DOT[row.tone])}
              />
              <p className="label-13 text-gray-900">{row.label}</p>
            </div>
            <p className="numeric text-gray-1000 text-right text-xs font-medium">
              {formatCurrency(row.value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

type PayloadEntry = {
  value?: number;
  payload?: { date?: string | Date; name?: string };
};

type RechartsTooltipProps = {
  active?: boolean;
  payload?: PayloadEntry[];
};

export const CashFlowTooltip = ({ active, payload }: RechartsTooltipProps) => {
  const [incomeEntry, expensesEntry] = payload ?? [];

  if (!active || !incomeEntry || !expensesEntry) return null;

  const date = incomeEntry.payload?.date;

  return (
    <ChartTooltip
      heading={date ? format(date, DISPLAY_DATE_FORMAT) : ""}
      rows={[
        { label: "Income", value: incomeEntry.value ?? 0, tone: "income" },
        {
          label: "Expenses",
          value: (expensesEntry.value ?? 0) * -1,
          tone: "expense",
        },
      ]}
    />
  );
};

export const CategoryTooltip = ({ active, payload }: RechartsTooltipProps) => {
  const [entry] = payload ?? [];

  if (!active || !entry) return null;

  return (
    <ChartTooltip
      heading={entry.payload?.name ?? ""}
      rows={[
        { label: "Expenses", value: (entry.value ?? 0) * -1, tone: "expense" },
      ]}
    />
  );
};

type NetWorthDatum = {
  date?: string | Date;
  assets?: number;
  liabilities?: number;
  netWorth?: number;
};

type NetWorthTooltipProps = {
  active?: boolean;
  payload?: { payload?: NetWorthDatum }[];
};

export const NetWorthTooltip = ({ active, payload }: NetWorthTooltipProps) => {
  const datum = payload?.at(0)?.payload;

  if (!active || !datum) return null;

  return (
    <ChartTooltip
      heading={datum.date ? format(datum.date, DISPLAY_DATE_FORMAT) : ""}
      rows={[
        { label: "Assets", value: datum.assets ?? 0, tone: "income" },
        {
          label: "Liabilities",
          value: datum.liabilities ?? 0,
          tone: "expense",
        },
        { label: "Net worth", value: datum.netWorth ?? 0, tone: "net" },
      ]}
    />
  );
};
