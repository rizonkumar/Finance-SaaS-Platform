"use client";

import { Suspense } from "react";
import { subDays } from "date-fns";
import { useSearchParams } from "next/navigation";

import { CardGridSkeleton } from "@/components/card-grid-skeleton";
import { ChartCard, ChartCardLoading } from "@/components/chart-card";
import { ErrorState } from "@/components/error-state";
import { ExportButton } from "@/components/export-button";
import { Filters } from "@/components/filters";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { useGetReports } from "@/features/reports/api/use-get-reports";
import { CategoryTrendCard } from "@/features/reports/components/category-trend-card";
import { MonthlyFlowChart } from "@/features/reports/components/monthly-flow-chart";
import { ReportSummaryGrid } from "@/features/reports/components/report-summary-grid";
import { TopPayeesCard } from "@/features/reports/components/top-payees-card";
import { REPORT_PERIOD_DAYS, reportCsvTable } from "@/lib/reports";
import { PAGE_META } from "@/lib/routes";
import { formatDateRange } from "@/lib/utils";

const ReportsLoading = () => (
  <div className="space-y-4">
    <CardGridSkeleton count={4} />
    <ChartCardLoading />
  </div>
);

const ReportsPage = () => (
  <Suspense fallback={<ReportsLoading />}>
    <ReportsPageContent />
  </Suspense>
);

const ReportsPageContent = () => {
  const params = useSearchParams();
  const reportsQuery = useGetReports();
  const report = reportsQuery.data;

  const today = new Date();
  const caption = formatDateRange({
    from: params.get("from") || subDays(today, REPORT_PERIOD_DAYS),
    to: params.get("to") || today,
  });

  const renderBody = () => {
    if (reportsQuery.isLoading) return <ReportsLoading />;

    if (reportsQuery.isError || !report) {
      return (
        <Card>
          <CardContent className="pt-5">
            <ErrorState onRetry={() => reportsQuery.refetch()} />
          </CardContent>
        </Card>
      );
    }

    const hasActivity = report.totals.income > 0 || report.totals.expenses > 0;

    return (
      <>
        <ReportSummaryGrid totals={report.totals} caption={caption} />
        <ChartCard title="Income vs Spending" isEmpty={!hasActivity}>
          {() => <MonthlyFlowChart data={report.monthly} />}
        </ChartCard>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="min-w-0 xl:col-span-2">
            <CategoryTrendCard
              months={report.months}
              rows={report.categories}
            />
          </div>
          <TopPayeesCard payees={report.payees} />
        </div>
      </>
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={PAGE_META["/reports"].title}
        description={PAGE_META["/reports"].description}
        filters={<Filters defaultDays={REPORT_PERIOD_DAYS} />}
        actions={
          <ExportButton
            name="report"
            disabled={!report}
            getTable={() =>
              reportCsvTable(
                report ?? { months: [], monthly: [], categories: [] }
              )
            }
          />
        }
      />
      {renderBody()}
    </div>
  );
};

export default ReportsPage;
