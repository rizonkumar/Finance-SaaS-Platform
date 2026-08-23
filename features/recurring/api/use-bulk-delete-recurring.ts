import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/hono";
import { toastMessages } from "@/lib/messages";
import { MONEY_DEPENDENT_KEYS, queryKeys } from "@/lib/query-keys";

type ResponseType = InferResponseType<
  (typeof client.api.recurring)["bulk-delete"]["$post"]
>;
type RequestType = InferRequestType<
  (typeof client.api.recurring)["bulk-delete"]["$post"]
>["json"];

const messages = toastMessages("Recurring transaction");

export const useBulkDeleteRecurring = () => {
  const queryClient = useQueryClient();

  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.recurring["bulk-delete"].$post({
        json,
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? messages.bulkDeleteError);
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success(messages.bulkDeleteSuccess);
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring() });
      MONEY_DEPENDENT_KEYS.forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey })
      );
    },
    onError: () => {
      toast.error(messages.bulkDeleteError);
    },
  });
};
