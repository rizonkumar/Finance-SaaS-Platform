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

  if (holdingsQuery.isLoading) {
    return (
      <div className="space-y-3">
        <CardGridSkeleton count={3} />
      </div>
    );
  }

  if (holdingsQuery.isError) {
    return (
      <Card>
        <CardContent>
          <ErrorState onRetry={() => holdingsQuery.refetch()} />
        </CardContent>
      </Card>
    );
  }

  const holdings = holdingsQuery.data ?? [];
  const totals = portfolioTotals(holdings);

  const allocation = holdings
    .filter((row) => row.marketValue > 0)
    .map((row) => ({ name: row.symbol, value: row.marketValue }))
    .sort((first, second) => second.value - first.value);

  return (
    <div className="space-y-3">
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

      {holdings.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={LineChart}
              title="No holdings yet"
              description="Add a stock or fund held in a broker account to track its value and return."
              actionLabel="Add Holding"
              onAction={newHolding.onOpen}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <PortfolioSummary totals={totals} />

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-6">
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
      )}
    </div>
  );
};

export default PortfolioPage;
