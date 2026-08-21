"use client";

import {
  NetWorthChart,
  NetWorthChartLoading,
} from "@/components/net-worth-chart";
import { useGetNetWorth } from "@/features/net-worth/api/use-get-net-worth";

export const NetWorthTrend = () => {
  const { data, isLoading } = useGetNetWorth();

  if (isLoading) return <NetWorthChartLoading />;

  return <NetWorthChart data={data?.days} />;
};
