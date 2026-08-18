"use client";

import { useState } from "react";
import { FileSearch } from "lucide-react";

import {
  ChartTypeSelect,
  type ChartTypeOption,
} from "@/components/chart-type-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CHART_HEIGHT } from "@/lib/constants";

type Props = {
  title: string;
  options: readonly ChartTypeOption[];
  defaultType: string;
  isEmpty: boolean;
  children: (chartType: string) => React.ReactNode;
};

export const ChartCard = ({
  title,
  options,
  defaultType,
  isEmpty,
  children,
}: Props) => {
  const [chartType, setChartType] = useState(defaultType);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 gap-x-4">
        <CardTitle>{title}</CardTitle>
        <ChartTypeSelect
          value={chartType}
          options={options}
          onChange={setChartType}
        />
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div
            className="flex w-full flex-col items-center justify-center gap-y-3"
            style={{ height: CHART_HEIGHT }}
          >
            <FileSearch className="size-6 text-gray-700" />
            <p className="copy-13 text-gray-900">No data for this period</p>
          </div>
        ) : (
          children(chartType)
        )}
      </CardContent>
    </Card>
  );
};

export const ChartCardLoading = () => {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 gap-x-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-28" />
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full" style={{ height: CHART_HEIGHT }} />
      </CardContent>
    </Card>
  );
};
