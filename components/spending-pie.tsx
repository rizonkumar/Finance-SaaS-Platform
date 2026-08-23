"use client";

import { AlignLeft, PieChart, Radar, Target } from "lucide-react";

import { CategoryBreakdown } from "@/components/category-breakdown";
import { ChartCard, ChartCardLoading } from "@/components/chart-card";
import type { ChartTypeOption } from "@/components/chart-type-select";
import { PieVariant } from "@/components/pie-variant";
import { RadarVariant } from "@/components/radar-variant";
import { RadialVariant } from "@/components/radial-variant";

const OPTIONS: readonly ChartTypeOption[] = [
  { value: "bars", label: "Bars", icon: AlignLeft },
  { value: "pie", label: "Pie", icon: PieChart },
  { value: "radar", label: "Radar", icon: Radar },
  { value: "radial", label: "Radial", icon: Target },
];

type Props = {
  data?: {
    name: string;
    value: number;
  }[];
};

export const SpendingPie = ({ data = [] }: Props) => {
  return (
    <ChartCard
      title="Spending by category"
      options={OPTIONS}
      defaultType="bars"
      isEmpty={data.length === 0}
    >
      {(chartType) => (
        <>
          {chartType === "bars" && <CategoryBreakdown data={data} />}
          {chartType === "pie" && <PieVariant data={data} />}
          {chartType === "radar" && <RadarVariant data={data} />}
          {chartType === "radial" && <RadialVariant data={data} />}
        </>
      )}
    </ChartCard>
  );
};

export const SpendingPieLoading = ChartCardLoading;
