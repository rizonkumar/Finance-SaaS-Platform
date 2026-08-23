import { Suspense } from "react";

import { AttentionCard } from "@/components/attention-card";
import { BalanceSheetGrid } from "@/components/balance-sheet-grid";
import { CardGridSkeleton } from "@/components/card-grid-skeleton";
import { DataCharts } from "@/components/data-charts";
import { DataGrid } from "@/components/data-grid";
import { Filters } from "@/components/filters";
import { NetWorthTrend } from "@/components/net-worth-trend";
import { PageHeader } from "@/components/page-header";
import { PositionGrid } from "@/components/position-grid";
import { Skeleton } from "@/components/ui/skeleton";
import { DebtsGlanceCard } from "@/features/debts/components/debts-glance-card";
import { GoalsGlanceCard } from "@/features/goals/components/goals-glance-card";
import { PAGE_META } from "@/lib/routes";

export default function DashboardPage() {
  return (
    <div className="space-y-3">
      <PageHeader
        title={PAGE_META["/"].title}
        description={PAGE_META["/"].description}
        filters={
          <Suspense fallback={<Skeleton className="h-7 w-64 rounded-full" />}>
            <Filters />
          </Suspense>
        }
      />
      <Suspense fallback={<CardGridSkeleton count={3} />}>
        <BalanceSheetGrid />
      </Suspense>
      <Suspense fallback={<CardGridSkeleton count={3} />}>
        <DataGrid />
      </Suspense>
      <Suspense fallback={<CardGridSkeleton count={1} />}>
        <AttentionCard />
      </Suspense>
      <Suspense fallback={<CardGridSkeleton count={1} />}>
        <NetWorthTrend />
      </Suspense>
      <Suspense fallback={<CardGridSkeleton count={2} />}>
        <PositionGrid />
      </Suspense>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Suspense fallback={<CardGridSkeleton count={1} />}>
          <GoalsGlanceCard />
        </Suspense>
        <Suspense fallback={<CardGridSkeleton count={1} />}>
          <DebtsGlanceCard />
        </Suspense>
      </div>
      <Suspense fallback={<CardGridSkeleton count={2} />}>
        <DataCharts />
      </Suspense>
    </div>
  );
}
