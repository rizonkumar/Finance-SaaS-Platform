import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

import { client } from "@/lib/hono";
import { queryKeys } from "@/lib/query-keys";
import { convertAmountFromMiliunits } from "@/lib/utils";

export const useGetNetWorth = () => {
  const params = useSearchParams();
  const from = params.get("from") || "";
  const to = params.get("to") || "";

  const query = useQuery({
    queryKey: [...queryKeys.netWorth(), { from, to }],
    queryFn: async () => {
      const response = await client.api["net-worth"].$get({
        query: { from, to },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch net worth");
      }

      const { data } = await response.json();

      return {
        assets: convertAmountFromMiliunits(data.assets),
        liabilities: convertAmountFromMiliunits(data.liabilities),
        netWorth: convertAmountFromMiliunits(data.netWorth),
        change: convertAmountFromMiliunits(data.change),
        positions: data.positions.map((position) => ({
          ...position,
          balance: convertAmountFromMiliunits(position.balance),
        })),
        days: data.days.map((day) => ({
          date: day.date,
          assets: convertAmountFromMiliunits(day.assets),
          liabilities: convertAmountFromMiliunits(day.liabilities),
          netWorth: convertAmountFromMiliunits(day.netWorth),
        })),
      };
    },
  });

  return query;
};
