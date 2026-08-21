import { Suspense } from "react";

import { AttentionCard } from "@/components/attention-card";
import { BalanceSheetGrid } from "@/components/balance-sheet-grid";
import { CardGridSkeleton } from "@/components/card-grid-skeleton";
import { DataCharts } from "@/components/data-charts";
import { DataGrid } from "@/components/data-grid";
import { NetWorthTrend } from "@/components/net-worth-trend";
import { PositionGrid } from "@/components/position-grid";
import { DebtsGlanceCard } from "@/features/debts/components/debts-glance-card";
import { GoalsGlanceCard } from "@/features/goals/components/goals-glance-card";

export default function DashboardPage() {
  return (
    <div className="space-y-4">
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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
