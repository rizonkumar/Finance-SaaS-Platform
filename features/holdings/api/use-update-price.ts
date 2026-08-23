import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/hono";
import { MONEY_DEPENDENT_KEYS, queryKeys } from "@/lib/query-keys";

type ResponseType = InferResponseType<
  (typeof client.api.holdings)[":id"]["price"]["$patch"]
>;
type RequestType = InferRequestType<
  (typeof client.api.holdings)[":id"]["price"]["$patch"]
>["json"];

const FAILED = "Could not update that price";

export const useUpdatePrice = (id?: string) => {
  const queryClient = useQueryClient();

  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.holdings[":id"].price.$patch({
        param: { id },
        json,
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? FAILED);
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Price updated");
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
