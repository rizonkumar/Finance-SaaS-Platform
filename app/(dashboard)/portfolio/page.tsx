"use client";

import { LineChart, TrendingUp } from "lucide-react";

import { CardGridSkeleton } from "@/components/card-grid-skeleton";
import { CategoryBreakdown } from "@/components/category-breakdown";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetHoldings } from "@/features/holdings/api/use-get-holdings";
import { HoldingsList } from "@/features/holdings/components/holdings-list";
import {
  PortfolioSummary,
  portfolioTotals,
} from "@/features/holdings/components/portfolio-summary";
import { useNewHolding } from "@/features/holdings/hooks/use-new-holding";
import { PAGE_META } from "@/lib/routes";
import { formatCurrency } from "@/lib/utils";

const PortfolioPage = () => {
  const newHolding = useNewHolding();
  const holdingsQuery = useGetHoldings();

  const holdings = holdingsQuery.data ?? [];
  const totals = portfolioTotals(holdings);

  const allocation = holdings
    .filter((row) => row.marketValue > 0)
    .map((row) => ({ name: row.symbol, value: row.marketValue }))
    .sort((first, second) => second.value - first.value);

  const renderBody = () => {
    if (holdingsQuery.isLoading) return <CardGridSkeleton count={3} />;

    if (holdingsQuery.isError) {
      return (
        <Card>
          <CardContent className="pt-5">
            <ErrorState onRetry={() => holdingsQuery.refetch()} />
          </CardContent>
        </Card>
      );
    }

    if (holdings.length === 0) {
      return (
        <Card>
          <CardContent className="pt-5">
            <EmptyState
              icon={LineChart}
              title="No holdings yet"
              description="Add a stock or fund held in a broker account to track its value and return."
              actionLabel="Add holding"
              onAction={newHolding.onOpen}
            />
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        <PortfolioSummary totals={totals} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
          <Card className="col-span-1 lg:col-span-4">
            <CardHeader>
              <CardTitle>Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              <HoldingsList holdings={holdings} />
            </CardContent>
          </Card>
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle>Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryBreakdown data={allocation} />
            </CardContent>
          </Card>
        </div>
      </>
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={PAGE_META["/portfolio"].title}
        description={PAGE_META["/portfolio"].description}
        chips={
          holdings.length > 0
            ? [
                {
                  label: `${holdings.length} ${holdings.length === 1 ? "holding" : "holdings"}`,
                  icon: LineChart,
                },
                {
                  label: `${formatCurrency(totals.realised)} realised`,
                  icon: TrendingUp,
                },
              ]
            : undefined
        }
      />

      {renderBody()}
    </div>
  );
};

export default PortfolioPage;
