import { toast } from "sonner";
import { type InferRequestType, type InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/hono";
import { toastMessages } from "@/lib/messages";
import { MONEY_DEPENDENT_KEYS } from "@/lib/query-keys";

type ResponseType = InferResponseType<
  (typeof client.api.transactions)["bulk-delete"]["$post"]
>;
type RequestType = InferRequestType<
  (typeof client.api.transactions)["bulk-delete"]["$post"]
>["json"];

const messages = toastMessages("Transaction");

export const useBulkDeleteTransactions = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.transactions["bulk-delete"]["$post"]({
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
      MONEY_DEPENDENT_KEYS.forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey })
      );
    },
    onError: (error) => {
      toast.error(error.message || messages.bulkDeleteError);
    },
  });

  return mutation;
};
