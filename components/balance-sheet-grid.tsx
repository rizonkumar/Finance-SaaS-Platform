"use client";

import { Landmark, Scale, Wallet } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";

import { DataCard, DataCardLoading } from "@/components/data-card";
import { useGetNetWorth } from "@/features/net-worth/api/use-get-net-worth";
import { DAY_PATTERN, DISPLAY_DATE_FORMAT } from "@/lib/constants";
import { parseDayUTC } from "@/lib/date-utc";
import { formatCurrency } from "@/lib/utils";

const GRID = "mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3";

const changeLabel = (change: number) => {
  if (change === 0) return "No change over this period";

  const direction = change > 0 ? "up" : "down";

  return `${formatCurrency(Math.abs(change))} ${direction} over this period`;
};

const countLabel = (count: number, noun: string) =>
  `${count} ${count === 1 ? noun : `${noun}s`}`;

export const BalanceSheetGrid = () => {
  const { data, isLoading } = useGetNetWorth();

  const params = useSearchParams();
  const to = params.get("to");

  if (isLoading) {
    return (
      <div className={GRID}>
        <DataCardLoading />
        <DataCardLoading />
        <DataCardLoading />
      </div>
    );
  }

  const positions = data?.positions ?? [];

  if (positions.length === 0) return null;

  const asOf =
    to && DAY_PATTERN.test(to)
      ? `As of ${format(parseDayUTC(to), DISPLAY_DATE_FORMAT)}`
      : "As of today";

  const owing = positions.filter((position) => position.balance < 0).length;

  return (
    <div className={GRID}>
      <DataCard
        title="Net Worth"
        value={data?.netWorth}
        dateRange={asOf}
        subtitle={changeLabel(data?.change ?? 0)}
        icon={Scale}
        variant={(data?.netWorth ?? 0) < 0 ? "warning" : "default"}
      />
      <DataCard
        title="Assets"
        value={data?.assets}
        dateRange={asOf}
        subtitle={`Held across ${countLabel(positions.length, "account")}`}
        icon={Wallet}
        variant="success"
      />
      <DataCard
        title="Liabilities"
        value={data?.liabilities}
        dateRange={asOf}
        subtitle={
          owing === 0
            ? "Outstanding debts only"
            : `${countLabel(owing, "account")} in the red, plus debts`
        }
        icon={Landmark}
        variant={(data?.liabilities ?? 0) > 0 ? "danger" : "default"}
      />
    </div>
  );
};
