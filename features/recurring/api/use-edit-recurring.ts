import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/hono";
import { toastMessages } from "@/lib/messages";
import { MONEY_DEPENDENT_KEYS, queryKeys } from "@/lib/query-keys";

type ResponseType = InferResponseType<
  (typeof client.api.recurring)[":id"]["$patch"]
>;
type RequestType = InferRequestType<
  (typeof client.api.recurring)[":id"]["$patch"]
>["json"];

const messages = toastMessages("Recurring transaction");

export const useEditRecurring = (id?: string) => {
  const queryClient = useQueryClient();

  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.recurring[":id"].$patch({
        param: { id },
        json,
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? messages.updateError);
      }

      return await response.json();
    },
    onSuccess: (result) => {
      const purged =
        "purgedTransactions" in result ? result.purgedTransactions : 0;

      toast.success(
        purged > 0
          ? `${messages.updateSuccess} · ${purged} generated transactions rebuilt`
          : messages.updateSuccess
      );

      queryClient.invalidateQueries({ queryKey: queryKeys.recurringItem(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring() });
      MONEY_DEPENDENT_KEYS.forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey })
      );
    },
    onError: (error) => {
      toast.error(error.message || messages.updateError);
    },
  });
};
