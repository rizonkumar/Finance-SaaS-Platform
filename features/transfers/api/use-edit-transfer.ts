import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/hono";
import { toastMessages } from "@/lib/messages";
import { MONEY_DEPENDENT_KEYS, queryKeys } from "@/lib/query-keys";

type ResponseType = InferResponseType<
  (typeof client.api.transfers)[":id"]["$patch"]
>;
type RequestType = InferRequestType<
  (typeof client.api.transfers)[":id"]["$patch"]
>["json"];

const messages = toastMessages("Transfer");

export const useEditTransfer = (id?: string) => {
  const queryClient = useQueryClient();

  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.transfers[":id"].$patch({
        param: { id },
        json,
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? messages.updateError);
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success(messages.updateSuccess);
      queryClient.invalidateQueries({ queryKey: queryKeys.transfer(id) });
      MONEY_DEPENDENT_KEYS.forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey })
      );
    },
    onError: (error) => {
      toast.error(error.message || messages.updateError);
    },
  });
};
