"use client";

import { format } from "date-fns";
import { SheetFormLoading } from "@/components/sheet-form-loading";
import { Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAddTrade } from "@/features/holdings/api/use-add-trade";
import { useDeleteTrade } from "@/features/holdings/api/use-delete-trade";
import { useGetHoldings } from "@/features/holdings/api/use-get-holdings";
import {
  TradeForm,
  type TradeApiValues,
} from "@/features/holdings/components/trade-form";
import { useTradeHolding } from "@/features/holdings/hooks/use-trade-holding";
import { DISPLAY_DATE_FORMAT } from "@/lib/constants";
import { cn, formatCurrency } from "@/lib/utils";

export const TradeHoldingSheet = () => {
  const { isOpen, onClose, id } = useTradeHolding();

  const addMutation = useAddTrade(id);
  const deleteMutation = useDeleteTrade(id);
  const holdingsQuery = useGetHoldings();

  const holding = holdingsQuery.data?.find((row) => row.id === id);
  const isPending = addMutation.isPending || deleteMutation.isPending;

  const onSubmit = (values: TradeApiValues) => {
    addMutation.mutate(values);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{holding?.symbol ?? "Record Trade"}</SheetTitle>
          <SheetDescription>
            {holding
              ? `${holding.quantity} units held at ${formatCurrency(holding.avgCost)} average cost.`
              : "Buying moves cash out of the account, selling moves it back in."}
          </SheetDescription>
        </SheetHeader>
        {holdingsQuery.isLoading || !holding ? (
          <SheetFormLoading />
        ) : (
          <div className="space-y-4">
            <TradeForm
              onSubmit={onSubmit}
              disabled={isPending}
              isSubmitting={addMutation.isPending}
            />
            <Separator />
            <div className="space-y-2">
              <p className="label-14 text-gray-1000">History</p>
              {holding.trades.length === 0 ? (
                <p className="copy-13 text-gray-900">
                  Nothing recorded yet. Trades you add show up here.
                </p>
              ) : (
                <ul className="divide-border divide-y">
                  {holding.trades.map((trade) => (
                    <li
                      key={trade.id}
                      className="flex items-start justify-between gap-x-3 py-2"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <p
                          className={cn(
                            "numeric text-sm font-medium",
                            trade.side === "sell"
                              ? "text-green-900"
                              : "text-gray-1000"
                          )}
                        >
                          {trade.side === "buy" ? "Bought" : "Sold"}{" "}
                          {trade.quantity} at {formatCurrency(trade.price)}
                        </p>
                        <p className="copy-13 text-gray-900">
                          {format(new Date(trade.date), DISPLAY_DATE_FORMAT)} ·{" "}
                          <span className="numeric">
                            {formatCurrency(trade.value)}
                          </span>
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={isPending}
                        aria-label="Delete trade"
                        onClick={() => deleteMutation.mutate(trade.id)}
                      >
                        <Trash className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
