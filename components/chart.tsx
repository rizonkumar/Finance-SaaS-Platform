"use client";

import { AreaChart, BarChart3, LineChart } from "lucide-react";

import { AreaVariant } from "@/components/area-variant";
import { BarVariant } from "@/components/bar-variant";
import { ChartCard, ChartCardLoading } from "@/components/chart-card";
import type { ChartTypeOption } from "@/components/chart-type-select";
import { LineVariant } from "@/components/line-variant";

const OPTIONS: readonly ChartTypeOption[] = [
  { value: "area", label: "Area", icon: AreaChart },
  { value: "line", label: "Line", icon: LineChart },
  { value: "bar", label: "Bar", icon: BarChart3 },
];

type Props = {
  data?: {
    date: string;
    income: number;
    expenses: number;
  }[];
};

export const Chart = ({ data = [] }: Props) => {
  return (
    <ChartCard
      title="Cash Flow"
      options={OPTIONS}
      defaultType="area"
      isEmpty={data.length === 0}
    >
      {(chartType) => (
        <>
          {chartType === "area" && <AreaVariant data={data} />}
          {chartType === "line" && <LineVariant data={data} />}
          {chartType === "bar" && <BarVariant data={data} />}
        </>
      )}
    </ChartCard>
  );
};

export const ChartLoading = ChartCardLoading;
