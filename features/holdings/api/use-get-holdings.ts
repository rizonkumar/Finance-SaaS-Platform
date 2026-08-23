import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/hono";
import { QUANTITY_FACTOR } from "@/lib/holdings";
import { queryKeys } from "@/lib/query-keys";
import { convertAmountFromMiliunits } from "@/lib/utils";

export const useGetHoldings = () => {
  return useQuery({
    queryKey: queryKeys.holdings(),
    queryFn: async () => {
      const response = await client.api.holdings.$get();

      if (!response.ok) {
        throw new Error("Failed to fetch holdings");
      }

      const { data } = await response.json();

      return data.map((holding) => ({
        ...holding,
        quantity: holding.quantity / QUANTITY_FACTOR,
        avgCost: convertAmountFromMiliunits(holding.avgCost),
        costBasis: convertAmountFromMiliunits(holding.costBasis),
        lastPrice: convertAmountFromMiliunits(holding.lastPrice),
        marketValue: convertAmountFromMiliunits(holding.marketValue),
        unrealisedGain: convertAmountFromMiliunits(holding.unrealisedGain),
        realisedGain: convertAmountFromMiliunits(holding.realisedGain),
        trades: holding.trades.map((trade) => ({
          ...trade,
          quantity: trade.quantity / QUANTITY_FACTOR,
          price: convertAmountFromMiliunits(trade.price),
          fees: convertAmountFromMiliunits(trade.fees),
          value: convertAmountFromMiliunits(trade.value),
        })),
      }));
    },
  });
};
