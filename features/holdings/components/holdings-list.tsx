"use client";

import { AlertTriangle, LineChart, Pencil, Repeat } from "lucide-react";

import { iconBox } from "@/components/data-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOpenHolding } from "@/features/holdings/hooks/use-open-holding";
import { useTradeHolding } from "@/features/holdings/hooks/use-trade-holding";
import { isPriceStale } from "@/lib/holdings";
import { cn, formatCurrency, formatPercentage } from "@/lib/utils";

const STALE_AFTER_DAYS = 7;

type Holding = {
  id: string;
  symbol: string;
  name: string;
  account: string;
  quantity: number;
  avgCost: number;
  lastPrice: number;
  lastPriceAt: string | null;
  marketValue: number;
  unrealisedGain: number;
  returnPercentage: number;
};

type Props = {
  holdings: Holding[];
};

export const HoldingsList = ({ holdings }: Props) => {
  const openHolding = useOpenHolding();
  const tradeHolding = useTradeHolding();
  const now = new Date();

  return (
    <ul className="divide-border divide-y">
      {holdings.map((holding) => {
        const stale = isPriceStale(
          holding.lastPriceAt ? new Date(holding.lastPriceAt) : null,
          now,
          STALE_AFTER_DAYS
        );
        const gained = holding.unrealisedGain >= 0;

        return (
          <li
            key={holding.id}
            className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3"
          >
            <div className={cn(iconBox({ variant: "default" }), "size-9")}>
              <LineChart className="size-4" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="copy-14 text-gray-1000 line-clamp-1 font-medium">
                {holding.symbol}
              </p>
              <p className="copy-13 line-clamp-1 text-gray-900">
                {holding.name} · {holding.account}
              </p>
            </div>

            <div className="text-right">
              <p className="copy-13 numeric text-gray-1000">
                {holding.quantity} @ {formatCurrency(holding.avgCost)}
              </p>
              <p className="copy-13 numeric flex items-center justify-end gap-x-1 text-gray-900">
                {stale && (
                  <AlertTriangle
                    className="size-3 text-amber-900"
                    aria-label="Price may be out of date"
                  />
                )}
                now {formatCurrency(holding.lastPrice)}
              </p>
            </div>

            <div className="w-28 text-right">
              <p className="numeric copy-14 text-gray-1000 font-medium">
                {formatCurrency(holding.marketValue)}
              </p>
              <Badge variant={gained ? "income" : "expense"}>
                <span className="numeric">
                  {gained ? "+" : ""}
                  {formatCurrency(holding.unrealisedGain)} ·{" "}
                  {formatPercentage(holding.returnPercentage)}
                </span>
              </Badge>
            </div>

            <div className="flex shrink-0 items-center gap-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => tradeHolding.onOpen(holding.id)}
              >
                <Repeat className="size-4" />
                Trade
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Edit holding"
                onClick={() => openHolding.onOpen(holding.id)}
              >
                <Pencil className="size-4" />
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
};
