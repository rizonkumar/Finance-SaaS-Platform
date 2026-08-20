"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useDebounce } from "react-use";

import { ErrorState } from "@/components/error-state";
import { MoneyInput } from "@/components/money-input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useGetPayoffPlan } from "@/features/debts/api/use-get-payoff-plan";
import { MAX_PROJECTION_MONTHS, type PayoffStrategy } from "@/lib/debts";
import { formatCurrency, formatMonths } from "@/lib/utils";

const DEBOUNCE_MS = 400;

const STRATEGY_META: Record<
  PayoffStrategy,
  { title: string; subtitle: string }
> = {
  snowball: {
    title: "Snowball",
    subtitle: "Smallest balance first — the quickest first win",
  },
  avalanche: {
    title: "Avalanche",
    subtitle: "Highest rate first — the cheapest overall",
  },
};

type Plan = {
  strategy: PayoffStrategy;
  months: number;
  totalInterest: number;
  clearedAll: boolean;
  order: {
    id: string;
    name: string;
    monthsToClear: number | null;
    interestPaid: number;
  }[];
};

const StrategyPanel = ({
  plan,
  isRecommended,
}: {
  plan: Plan;
  isRecommended: boolean;
}) => {
  const meta = STRATEGY_META[plan.strategy];

  return (
    <div className="border-border space-y-3 rounded-md border p-4">
      <div className="flex items-start justify-between gap-x-2">
        <div className="space-y-0.5">
          <p className="heading-14 text-gray-1000">{meta.title}</p>
          <p className="copy-13 text-gray-900">{meta.subtitle}</p>
        </div>
        {isRecommended && <Badge variant="income">Recommended</Badge>}
      </div>
      <div className="space-y-1">
        <p className="copy-13 text-gray-900">
          {plan.clearedAll ? (
            <>
              Debt free in{" "}
              <span className="numeric text-gray-1000 font-medium">
                {formatMonths(plan.months)}
              </span>
            </>
          ) : (
            "Does not clear at this payment"
          )}
        </p>
        <p className="copy-13 text-gray-900">
          <span className="numeric">{formatCurrency(plan.totalInterest)}</span>{" "}
          of interest along the way
        </p>
      </div>
      <ol className="divide-border divide-y">
        {plan.order.map((entry, index) => (
          <li
            key={entry.id}
            className="flex items-baseline justify-between gap-x-3 py-1.5"
          >
            <span className="copy-13 text-gray-1000 min-w-0 truncate">
              {index + 1}. {entry.name}
            </span>
            <span className="copy-13 numeric shrink-0 text-gray-900">
              {entry.monthsToClear === null
                ? "—"
                : formatMonths(entry.monthsToClear)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
};

export const PayoffPlanCard = () => {
  const [input, setInput] = useState("");
  const [extra, setExtra] = useState(0);

  useDebounce(
    () => {
      const parsed = parseFloat(input);

      setExtra(Number.isFinite(parsed) && parsed > 0 ? parsed : 0);
    },
    DEBOUNCE_MS,
    [input]
  );

  const planQuery = useGetPayoffPlan(extra);
  const plan = planQuery.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payoff Plan</CardTitle>
        <CardDescription>
          Both routes pay the same amount each month. They only differ in which
          debt gets the leftover once every minimum is covered.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-w-xs space-y-1.5">
          <Label htmlFor="extra-payment">Extra each month</Label>
          <MoneyInput
            value={input}
            onChange={(value) => setInput(value ?? "")}
            placeholder="0.00"
          />
          {plan && (
            <p className="copy-13 text-gray-900">
              On top of{" "}
              <span className="numeric">
                {formatCurrency(plan.minimumTotal)}
              </span>{" "}
              of minimum payments.
            </p>
          )}
        </div>

        {planQuery.isError && (
          <ErrorState onRetry={() => planQuery.refetch()} />
        )}

        {planQuery.isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="size-4 animate-spin text-gray-600" />
          </div>
        )}

        {plan && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <StrategyPanel
                plan={plan.snowball}
                isRecommended={plan.recommended === "snowball"}
              />
              <StrategyPanel
                plan={plan.avalanche}
                isRecommended={plan.recommended === "avalanche"}
              />
            </div>
            <p className="copy-13 text-gray-900">
              {plan.interestSaved > 0 ? (
                <>
                  Going highest-rate-first saves{" "}
                  <span className="numeric text-gray-1000 font-medium">
                    {formatCurrency(plan.interestSaved)}
                  </span>{" "}
                  in interest
                  {plan.monthsSaved > 0 && (
                    <> and finishes {formatMonths(plan.monthsSaved)} sooner</>
                  )}
                  .
                </>
              ) : (
                "Both routes cost the same here, so take the snowball for the quicker first win."
              )}
            </p>
            {!plan.snowball.clearedAll && !plan.avalanche.clearedAll && (
              <p className="copy-13 text-amber-900">
                Neither route clears these debts within{" "}
                {formatMonths(MAX_PROJECTION_MONTHS)} — the payments are not
                keeping up with the interest.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
