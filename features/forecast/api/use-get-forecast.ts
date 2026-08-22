import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

import { client } from "@/lib/hono";
import { queryKeys } from "@/lib/query-keys";
import { convertAmountFromMiliunits } from "@/lib/utils";

export const useGetForecast = () => {
  const params = useSearchParams();
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const accountId = params.get("accountId") || "";

  return useQuery({
    queryKey: [...queryKeys.forecast(), { from, to, accountId }],
    queryFn: async () => {
      const response = await client.api.forecast.$get({
        query: {
          from,
          to,
          accountId,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch forecast");
      }

      const { data } = await response.json();

      return {
        openingBalance: convertAmountFromMiliunits(data.openingBalance),
        closingBalance: convertAmountFromMiliunits(data.closingBalance),
        projectedChange: convertAmountFromMiliunits(data.projectedChange),
        lowestPoint: data.lowestPoint
          ? {
              ...data.lowestPoint,
              date: new Date(data.lowestPoint.date),
              balance: convertAmountFromMiliunits(data.lowestPoint.balance),
            }
          : null,
        upcomingIncome: convertAmountFromMiliunits(data.upcomingIncome),
        upcomingExpenses: convertAmountFromMiliunits(data.upcomingExpenses),
        days: data.days.map((day) => ({
          ...day,
          date: new Date(day.date),
          balance: convertAmountFromMiliunits(day.balance),
          income: convertAmountFromMiliunits(day.income),
          expenses: convertAmountFromMiliunits(day.expenses),
        })),
        events: data.events.map((event) => ({
          ...event,
          date: new Date(event.date),
          amount: convertAmountFromMiliunits(event.amount),
        })),
      };
    },
  });
};
