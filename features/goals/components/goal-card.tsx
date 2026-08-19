import { format } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Infinity as InfinityIcon,
  MoreHorizontal,
  Plus,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoalProgress } from "@/features/goals/components/goal-progress";
import { DISPLAY_DATE_FORMAT } from "@/lib/constants";
import type { GoalStatus } from "@/lib/goals";
import { formatCurrency, formatPercentage } from "@/lib/utils";

type Props = {
  id: string;
  name: string;
  account: string | null;
  targetAmount: number;
  saved: number;
  remaining: number;
  percentage: number;
  expectedPercentage: number | null;
  status: GoalStatus;
  daysRemaining: number | null;
  requiredPerMonth: number | null;
  targetDate: string | null;
  onEdit: (id: string) => void;
  onContribute: (id: string) => void;
};

const STATUS_META = {
  completed: { label: "Funded", icon: CheckCircle2, variant: "income" },
  ahead: { label: "Ahead of pace", icon: TrendingUp, variant: "income" },
  "on-track": { label: "On track", icon: CheckCircle2, variant: "info" },
  behind: { label: "Behind pace", icon: AlertTriangle, variant: "warning" },
  "no-deadline": { label: "No deadline", icon: InfinityIcon, variant: "muted" },
} as const;

const deadlineLabel = (days: number | null, targetDate: string | null) => {
  if (days === null || !targetDate) return "No deadline set";

  const on = `by ${format(new Date(targetDate), DISPLAY_DATE_FORMAT)}`;

  if (days > 1) return `${days} days left · ${on}`;
  if (days === 1) return `1 day left · ${on}`;
  if (days === 0) return `Due today · ${on}`;

  return `${Math.abs(days)} days overdue · was due ${on}`;
};

export const GoalCard = ({
  id,
  name,
  account,
  targetAmount,
  saved,
  remaining,
  percentage,
  expectedPercentage,
  status,
  daysRemaining,
  requiredPerMonth,
  targetDate,
  onEdit,
  onContribute,
}: Props) => {
  const meta = STATUS_META[status];
  const StatusIcon = meta.icon;
  const isFunded = status === "completed";

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0 gap-x-3">
        <div className="min-w-0 space-y-1.5">
          <CardTitle className="line-clamp-1">{name}</CardTitle>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={meta.variant}>
              <StatusIcon className="size-3" />
              {meta.label}
            </Badge>
            {account && <Badge variant="outline">{account}</Badge>}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Edit ${name}`}
          onClick={() => onEdit(id)}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <GoalProgress
          percentage={percentage}
          expectedPercentage={expectedPercentage}
          status={status}
        />
        <div className="flex items-baseline justify-between gap-x-2">
          <p className="numeric text-gray-1000 text-lg font-semibold">
            {formatCurrency(saved)}
          </p>
          <p className="copy-13 text-gray-900">
            of <span className="numeric">{formatCurrency(targetAmount)}</span>
          </p>
        </div>
        <p className="copy-13 text-gray-900">
          <span className="numeric">{formatPercentage(percentage)}</span> saved
          {!isFunded && (
            <>
              {" · "}
              <span className="numeric">{formatCurrency(remaining)}</span> to go
            </>
          )}
        </p>
        <div className="border-border space-y-1 border-t pt-3">
          <p className="copy-13 flex items-center gap-x-1.5 text-gray-900">
            <Clock className="size-3.5 shrink-0" />
            {deadlineLabel(daysRemaining, targetDate)}
          </p>
          {!isFunded && requiredPerMonth !== null && (
            <p className="copy-13 text-gray-900">
              Set aside{" "}
              <span className="numeric text-gray-1000 font-medium">
                {formatCurrency(requiredPerMonth)}
              </span>{" "}
              a month to finish on time.
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onContribute(id)}
        >
          <Plus className="size-4" />
          {isFunded ? "Adjust Funds" : "Add Funds"}
        </Button>
      </CardContent>
    </Card>
  );
};
