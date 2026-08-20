import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/hono";
import { queryKeys } from "@/lib/query-keys";
import { convertAmountFromMiliunits } from "@/lib/utils";

export const useGetTransfer = (id?: string) => {
  return useQuery({
    enabled: !!id,
    queryKey: queryKeys.transfer(id),
    queryFn: async () => {
      const response = await client.api.transfers[":id"].$get({
        param: { id },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch transfer");
      }

      const { data } = await response.json();

      return { ...data, amount: convertAmountFromMiliunits(data.amount) };
    },
  });
};
