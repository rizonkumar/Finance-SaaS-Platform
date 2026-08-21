"use client";

import { ChartCard, ChartCardLoading } from "@/components/chart-card";
import {
  NetWorthVariant,
  type NetWorthDay,
} from "@/components/net-worth-variant";

type Props = {
  data?: NetWorthDay[];
};

export const NetWorthChart = ({ data = [] }: Props) => {
  return (
    <ChartCard title="Net Worth Trend" isEmpty={data.length === 0}>
      {() => <NetWorthVariant data={data} />}
    </ChartCard>
  );
};

export const NetWorthChartLoading = ChartCardLoading;
