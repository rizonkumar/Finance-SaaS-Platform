"use client";

import { Chart, ChartLoading } from "@/components/chart";
import { SpendingPie, SpendingPieLoading } from "@/components/spending-pie";
import { useGetSummary } from "@/features/summary/api/use-get-summary";

const GRID = "grid grid-cols-1 gap-4 lg:grid-cols-6";
const WIDE = "col-span-1 lg:col-span-3 xl:col-span-4";
const NARROW = "col-span-1 lg:col-span-3 xl:col-span-2";

export const DataCharts = () => {
  const { data, isLoading } = useGetSummary();

  if (isLoading) {
    return (
      <div className={GRID}>
        <div className={WIDE}>
          <ChartLoading />
        </div>
        <div className={NARROW}>
          <SpendingPieLoading />
        </div>
      </div>
    );
  }

  return (
    <div className={GRID}>
      <div className={WIDE}>
        <Chart data={data?.days} />
      </div>
      <div className={NARROW}>
        <SpendingPie data={data?.categories} />
      </div>
    </div>
  );
};
