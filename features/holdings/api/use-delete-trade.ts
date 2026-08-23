import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/hono";
import { MONEY_DEPENDENT_KEYS, queryKeys } from "@/lib/query-keys";

type ResponseType = InferResponseType<
  (typeof client.api.holdings)[":id"]["trades"][":tradeId"]["$delete"]
>;

const FAILED = "Could not delete that trade";

export const useDeleteTrade = (id?: string) => {
  const queryClient = useQueryClient();

  return useMutation<ResponseType, Error, string>({
    mutationFn: async (tradeId) => {
      const response = await client.api.holdings[":id"].trades[
        ":tradeId"
      ].$delete({ param: { id, tradeId } });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? FAILED);
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Trade deleted");
      queryClient.invalidateQueries({ queryKey: queryKeys.holding(id) });
      MONEY_DEPENDENT_KEYS.forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey })
      );
    },
    onError: (error) => {
      toast.error(error.message || FAILED);
    },
  });
};
