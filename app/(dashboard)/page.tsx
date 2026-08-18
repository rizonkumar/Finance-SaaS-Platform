import { Suspense } from "react";

import { CardGridSkeleton } from "@/components/card-grid-skeleton";
import { DataCharts } from "@/components/data-charts";
import { DataGrid } from "@/components/data-grid";

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <Suspense fallback={<CardGridSkeleton count={3} />}>
        <DataGrid />
      </Suspense>
      <Suspense fallback={<CardGridSkeleton count={2} />}>
        <DataCharts />
      </Suspense>
    </div>
  );
}
