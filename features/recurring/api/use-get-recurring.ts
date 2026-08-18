import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/hono";
import { queryKeys } from "@/lib/query-keys";
import { convertAmountFromMiliunits } from "@/lib/utils";

export const useGetRecurring = (id?: string) => {
  return useQuery({
    enabled: !!id,
    queryKey: queryKeys.recurringItem(id),
    queryFn: async () => {
      const response = await client.api.recurring[":id"].$get({
        param: { id },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch recurring transaction");
      }

      const { data } = await response.json();

      if (!data) {
        throw new Error("Recurring transaction not found");
      }

      return {
        ...data,
        amount: convertAmountFromMiliunits(data.amount),
      };
    },
  });
};
