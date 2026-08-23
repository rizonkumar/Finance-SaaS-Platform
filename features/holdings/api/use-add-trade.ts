import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/hono";
import { MONEY_DEPENDENT_KEYS, queryKeys } from "@/lib/query-keys";

type ResponseType = InferResponseType<
  (typeof client.api.holdings)[":id"]["trades"]["$post"]
>;
type RequestType = InferRequestType<
  (typeof client.api.holdings)[":id"]["trades"]["$post"]
>["json"];

const FAILED = "Could not record that trade";

export const useAddTrade = (id?: string) => {
  const queryClient = useQueryClient();

  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.holdings[":id"].trades.$post({
        param: { id },
        json,
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? FAILED);
      }

      return await response.json();
    },
    onSuccess: (_data, variables) => {
      toast.success(
        variables.side === "buy" ? "Purchase recorded" : "Sale recorded"
      );
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
