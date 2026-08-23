"use client";

import {
  AlertTriangle,
  CalendarRange,
  CheckCircle2,
  Pencil,
  Plus,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetProgress } from "@/features/budgets/components/budget-progress";
import { useNewTransaction } from "@/features/transactions/hooks/use-new-transaction";
import type { BudgetStatus } from "@/lib/budgets";
import { formatCurrency, formatDateRange, formatPercentage } from "@/lib/utils";

type Props = {
  id: string;
  categoryId: string | null;
  category: string | null;
  period: string;
  amount: number;
  periodStart: string;
  periodEnd: string;
  spent: number;
  remaining: number;
  percentage: number;
  status: BudgetStatus;
  isActiveNow: boolean;
  onEdit: (id: string) => void;
};

const STATUS_META = {
  "on-track": { label: "On track", icon: CheckCircle2, variant: "income" },
  warning: { label: "Close to limit", icon: TrendingUp, variant: "warning" },
  over: { label: "Over budget", icon: AlertTriangle, variant: "expense" },
} as const;

export const BudgetCard = ({
  id,
  categoryId,
  category,
  period,
  amount,
  periodStart,
  periodEnd,
  spent,
  remaining,
  percentage,
  status,
  isActiveNow,
  onEdit,
}: Props) => {
  const meta = STATUS_META[status];
  const StatusIcon = meta.icon;
  const newTransaction = useNewTransaction();

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0 gap-x-3">
        <div className="min-w-0 space-y-1.5">
          <CardTitle className="line-clamp-1">
            {category ?? "Overall spending"}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="muted" className="capitalize">
              {period}
            </Badge>
            <Badge variant="muted">
              <CalendarRange className="size-3" />
              {formatDateRange({ from: periodStart, to: periodEnd })}
            </Badge>
            <Badge variant={meta.variant}>
              <StatusIcon className="size-3" />
              {meta.label}
            </Badge>
            {!isActiveNow && <Badge variant="outline">Inactive</Badge>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => newTransaction.onOpen({ categoryId })}
          >
            <Plus className="size-4" />
            Add spend
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Edit budget"
            onClick={() => onEdit(id)}
          >
            <Pencil className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <BudgetProgress percentage={percentage} status={status} />
        <div className="flex items-baseline justify-between gap-x-2">
          <p className="numeric text-gray-1000 text-lg font-semibold">
            {formatCurrency(spent)}
          </p>
          <p className="copy-13 text-gray-900">
            of <span className="numeric">{formatCurrency(amount)}</span>
          </p>
        </div>
        <p className="copy-13 text-gray-900">
          <span className="numeric">{formatPercentage(percentage)}</span> used ·{" "}
          <span className="numeric">{formatCurrency(Math.abs(remaining))}</span>{" "}
          {remaining < 0 ? "over" : "left"}
        </p>
      </CardContent>
    </Card>
  );
};
