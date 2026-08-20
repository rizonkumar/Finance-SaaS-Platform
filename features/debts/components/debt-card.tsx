import { format } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  Infinity as InfinityIcon,
  MoreHorizontal,
  Plus,
  TrendingDown,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PayoffProgress } from "@/features/debts/components/payoff-progress";
import { DEBT_KIND_LABELS, type DebtKind } from "@/features/debts/kinds";
import { DISPLAY_DATE_FORMAT } from "@/lib/constants";
import { aprFromBasisPoints, type DebtStatus } from "@/lib/debts";
import { formatCurrency, formatMonths, formatPercentage } from "@/lib/utils";

type Props = {
  id: string;
  name: string;
  kind: DebtKind;
  account: string | null;
  principal: number;
  paid: number;
  balance: number;
  percentage: number;
  status: DebtStatus;
  aprBasisPoints: number;
  minimumPayment: number;
  monthsToPayoff: number | null;
  projectedPayoff: string | null;
  projectedInterest: number | null;
  requiredPayment: number | null;
  targetDate: string | null;
  onEdit: (id: string) => void;
  onPay: (id: string) => void;
};

const STATUS_META = {
  cleared: { label: "Cleared", icon: CheckCircle2, variant: "income" },
  ahead: { label: "Ahead of plan", icon: TrendingDown, variant: "income" },
  "on-track": { label: "On track", icon: CheckCircle2, variant: "info" },
  behind: { label: "Behind plan", icon: AlertTriangle, variant: "warning" },
  stalled: { label: "Not shrinking", icon: AlertTriangle, variant: "expense" },
  "no-deadline": {
    label: "No target date",
    icon: InfinityIcon,
    variant: "muted",
  },
} as const;

const displayDate = (value: string) =>
  format(new Date(value), DISPLAY_DATE_FORMAT);

export const DebtCard = ({
  id,
  name,
  kind,
  account,
  principal,
  paid,
  balance,
  percentage,
  status,
  aprBasisPoints,
  minimumPayment,
  monthsToPayoff,
  projectedPayoff,
  projectedInterest,
  requiredPayment,
  targetDate,
  onEdit,
  onPay,
}: Props) => {
  const meta = STATUS_META[status];
  const StatusIcon = meta.icon;
  const isCleared = status === "cleared";
  const isStalled = status === "stalled";
  const needsMore =
    requiredPayment !== null && requiredPayment > minimumPayment + 0.01;

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
            <Badge variant="outline">{DEBT_KIND_LABELS[kind]}</Badge>
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
        <PayoffProgress percentage={percentage} status={status} />
        <div className="flex items-baseline justify-between gap-x-2">
          <p className="numeric text-gray-1000 text-lg font-semibold">
            {formatCurrency(balance)}
          </p>
          <p className="copy-13 text-gray-900">
            of <span className="numeric">{formatCurrency(principal)}</span>
          </p>
        </div>
        <p className="copy-13 text-gray-900">
          <span className="numeric">{formatPercentage(percentage)}</span>{" "}
          cleared
          {paid !== 0 && (
            <>
              {" · "}
              <span className="numeric">{formatCurrency(paid)}</span> paid
            </>
          )}
        </p>
        <div className="border-border space-y-1 border-t pt-3">
          <p className="copy-13 text-gray-900">
            <span className="numeric">
              {aprFromBasisPoints(aprBasisPoints)}%
            </span>{" "}
            APR ·{" "}
            <span className="numeric">{formatCurrency(minimumPayment)}</span> a
            month
          </p>
          {isCleared && (
            <p className="copy-13 text-gray-900">
              Cleared — nothing left to pay.
            </p>
          )}
          {isStalled && (
            <p className="copy-13 text-amber-900">
              The monthly payment does not cover the interest, so the balance is
              not going down.
            </p>
          )}
          {!isCleared && !isStalled && monthsToPayoff !== null && (
            <p className="copy-13 text-gray-900">
              Clear in{" "}
              <span className="numeric text-gray-1000 font-medium">
                {formatMonths(monthsToPayoff)}
              </span>
              {projectedPayoff && <> · {displayDate(projectedPayoff)}</>}
            </p>
          )}
          {!isCleared &&
            projectedInterest !== null &&
            projectedInterest > 0 && (
              <p className="copy-13 text-gray-900">
                <span className="numeric">
                  {formatCurrency(projectedInterest)}
                </span>{" "}
                of interest at this pace.
              </p>
            )}
          {!isCleared && targetDate && (
            <p className="copy-13 text-gray-900">
              Target {displayDate(targetDate)}
              {needsMore && (
                <>
                  {" — "}pay{" "}
                  <span className="numeric text-gray-1000 font-medium">
                    {formatCurrency(requiredPayment)}
                  </span>{" "}
                  a month to hit it.
                </>
              )}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onPay(id)}
        >
          <Plus className="size-4" />
          {isCleared ? "Adjust Balance" : "Log Payment"}
        </Button>
      </CardContent>
    </Card>
  );
};
