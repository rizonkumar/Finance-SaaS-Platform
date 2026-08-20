import { useQuery } from "@tanstack/react-query";

import { normalizeDebt } from "@/features/debts/api/normalize-debt";
import { client } from "@/lib/hono";
import { queryKeys } from "@/lib/query-keys";
import { convertAmountFromMiliunits } from "@/lib/utils";

export const useGetDebt = (id?: string) => {
  return useQuery({
    enabled: !!id,
    queryKey: queryKeys.debt(id),
    queryFn: async () => {
      const response = await client.api.debts[":id"].$get({ param: { id } });

      if (!response.ok) {
        throw new Error("Failed to fetch debt");
      }

      const { data } = await response.json();

      return {
        ...normalizeDebt(data),
        payments: data.payments.map((payment) => ({
          ...payment,
          amount: convertAmountFromMiliunits(payment.amount),
        })),
      };
    },
  });
};
