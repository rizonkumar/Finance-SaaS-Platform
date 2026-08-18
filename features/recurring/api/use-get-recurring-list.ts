import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/hono";
import { queryKeys } from "@/lib/query-keys";
import { convertAmountFromMiliunits } from "@/lib/utils";

export const useGetRecurringList = () => {
  return useQuery({
    queryKey: queryKeys.recurring(),
    queryFn: async () => {
      const response = await client.api.recurring.$get();

      if (!response.ok) {
        throw new Error("Failed to fetch recurring transactions");
      }

      const { data } = await response.json();

      return data.map((item) => ({
        ...item,
        amount: convertAmountFromMiliunits(item.amount),
      }));
    },
  });
};
