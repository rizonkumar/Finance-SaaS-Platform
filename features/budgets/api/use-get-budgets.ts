import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/hono";
import { queryKeys } from "@/lib/query-keys";
import { convertAmountFromMiliunits } from "@/lib/utils";

export const useGetBudgets = () => {
  return useQuery({
    queryKey: queryKeys.budgets(),
    queryFn: async () => {
      const response = await client.api.budgets.$get();

      if (!response.ok) {
        throw new Error("Failed to fetch budgets");
      }

      const { data } = await response.json();

      return data.map((budget) => ({
        ...budget,
        amount: convertAmountFromMiliunits(budget.amount),
        spent: convertAmountFromMiliunits(budget.spent),
        remaining: convertAmountFromMiliunits(budget.remaining),
      }));
    },
  });
};
