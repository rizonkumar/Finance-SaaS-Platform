"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetBudgets } from "@/features/budgets/api/use-get-budgets";
import { useGetDebts } from "@/features/debts/api/use-get-debts";
import { useGetGoals } from "@/features/goals/api/use-get-goals";
import { buildAttentionItems } from "@/lib/attention";
import { cn } from "@/lib/utils";

const MAX_VISIBLE = 5;

export const AttentionCard = () => {
  const budgetsQuery = useGetBudgets();
  const goalsQuery = useGetGoals();
  const debtsQuery = useGetDebts();

  const isLoading =
    budgetsQuery.isLoading || goalsQuery.isLoading || debtsQuery.isLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Needs Attention</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  const budgets = budgetsQuery.data ?? [];
  const goals = goalsQuery.data ?? [];
  const debts = debtsQuery.data ?? [];

  if (budgets.length === 0 && goals.length === 0 && debts.length === 0) {
    return null;
  }

  const items = buildAttentionItems({ budgets, goals, debts });
  const visible = items.slice(0, MAX_VISIBLE);
  const hiddenCount = items.length - visible.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Needs Attention</CardTitle>
      </CardHeader>
      <CardContent>
        {visible.length === 0 ? (
          <div className="flex items-center gap-x-2 text-gray-900">
            <CheckCircle2 className="size-4 shrink-0 text-green-700" />
            <p className="copy-13">
              Budgets, goals and debts are all on track.
            </p>
          </div>
        ) : (
          <ul className="divide-border divide-y">
            {visible.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="hover:bg-alpha-100 -mx-1 flex items-center justify-between gap-x-3 rounded-sm px-1 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-x-2">
                    <AlertTriangle
                      className={cn(
                        "size-4 shrink-0",
                        item.severity === "critical"
                          ? "text-red-900"
                          : "text-amber-900"
                      )}
                    />
                    <div className="min-w-0">
                      <p className="copy-13 text-gray-1000 line-clamp-1 font-medium">
                        {item.title}
                      </p>
                      <p className="copy-13 line-clamp-1 text-gray-900">
                        {item.reason}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      item.severity === "critical" ? "expense" : "warning"
                    }
                    className="shrink-0 capitalize"
                  >
                    {item.kind}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {hiddenCount > 0 && (
          <p className="copy-13 pt-2 text-gray-900">+{hiddenCount} more</p>
        )}
      </CardContent>
    </Card>
  );
};
