"use client";

import { Suspense } from "react";
import { addDays, format } from "date-fns";
import { useSearchParams } from "next/navigation";

import { CardGridSkeleton } from "@/components/card-grid-skeleton";
import { ChartCard, ChartCardLoading } from "@/components/chart-card";
import { ErrorState } from "@/components/error-state";
import { Filters } from "@/components/filters";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { useGetForecast } from "@/features/forecast/api/use-get-forecast";
import { ForecastBalanceChart } from "@/features/forecast/components/forecast-balance-chart";
import { ForecastEventsCard } from "@/features/forecast/components/forecast-events-card";
import { ForecastSummaryGrid } from "@/features/forecast/components/forecast-summary-grid";
import { DEFAULT_PERIOD_DAYS } from "@/lib/constants";
import { parseDayUTC } from "@/lib/date-utc";
import { PAGE_META } from "@/lib/routes";

function forecastDateRange(from?: string, to?: string) {
  const start = from ? parseDayUTC(from) : new Date();
  const end = to ? parseDayUTC(to) : addDays(start, DEFAULT_PERIOD_DAYS);

  return `${format(start, "LLL dd")} - ${format(end, "LLL dd, y")}`;
}

const ForecastPage = () => {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <CardGridSkeleton count={5} />
          <ChartCardLoading />
        </div>
      }
    >
      <ForecastPageContent />
    </Suspense>
  );
};

const ForecastPageContent = () => {
  const params = useSearchParams();
  const forecastQuery = useGetForecast();

  if (forecastQuery.isLoading) {
    return (
      <div className="space-y-4">
        <CardGridSkeleton count={5} />
        <ChartCardLoading />
      </div>
    );
  }

  if (forecastQuery.isError) {
    return (
      <Card>
        <CardContent>
          <ErrorState onRetry={() => forecastQuery.refetch()} />
        </CardContent>
      </Card>
    );
  }

  const forecast = forecastQuery.data;
  const dateRange = forecastDateRange(
    params.get("from") || undefined,
    params.get("to") || undefined
  );

  return (
    <div className="space-y-3">
      <PageHeader
        title={PAGE_META["/forecast"].title}
        description={PAGE_META["/forecast"].description}
        filters={<Filters />}
      />
      <ForecastSummaryGrid
        closingBalance={forecast?.closingBalance ?? 0}
        projectedChange={forecast?.projectedChange ?? 0}
        lowestPoint={forecast?.lowestPoint ?? null}
        upcomingIncome={forecast?.upcomingIncome ?? 0}
        upcomingExpenses={forecast?.upcomingExpenses ?? 0}
        dateRange={dateRange}
      />

      <ChartCard
        title="Projected Balance"
        isEmpty={(forecast?.days.length ?? 0) === 0}
      >
        {() => <ForecastBalanceChart data={forecast?.days ?? []} />}
      </ChartCard>

      <ForecastEventsCard events={forecast?.events ?? []} />
    </div>
  );
};

export default ForecastPage;
