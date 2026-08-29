"use client";

import {
  NetWorthChart,
  NetWorthChartLoading,
} from "@/components/net-worth-chart";
import { ErrorState } from "@/components/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { useGetNetWorth } from "@/features/net-worth/api/use-get-net-worth";

export const NetWorthTrend = () => {
  const { data, isLoading, isError, refetch } = useGetNetWorth();

  if (isLoading) return <NetWorthChartLoading />;

  if (isError) {
    return (
      <Card>
        <CardContent>
          <ErrorState onRetry={() => refetch()} />
        </CardContent>
      </Card>
    );
  }

  return <NetWorthChart data={data?.days} />;
};
