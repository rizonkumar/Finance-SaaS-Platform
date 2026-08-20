import { useQuery } from "@tanstack/react-query";

import { normalizeDebt } from "@/features/debts/api/normalize-debt";
import { client } from "@/lib/hono";
import { queryKeys } from "@/lib/query-keys";

export const useGetDebts = () => {
  return useQuery({
    queryKey: queryKeys.debts(),
    queryFn: async () => {
      const response = await client.api.debts.$get();

      if (!response.ok) {
        throw new Error("Failed to fetch debts");
      }

      const { data } = await response.json();

      return data.map(normalizeDebt);
    },
  });
};
