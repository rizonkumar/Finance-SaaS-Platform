import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/hono";
import { queryKeys } from "@/lib/query-keys";
import { convertAmountFromMiliunits } from "@/lib/utils";

export const useGetBudget = (id?: string) => {
  return useQuery({
    enabled: !!id,
    queryKey: queryKeys.budget(id),
    queryFn: async () => {
      const response = await client.api.budgets[":id"].$get({
        param: { id },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch budget");
      }

      const { data } = await response.json();

      if (!data) {
        throw new Error("Budget not found");
      }

      return {
        ...data,
        amount: convertAmountFromMiliunits(data.amount),
        spent: convertAmountFromMiliunits(data.spent),
        remaining: convertAmountFromMiliunits(data.remaining),
      };
    },
  });
};
