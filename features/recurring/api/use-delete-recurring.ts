import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/hono";
import { toastMessages } from "@/lib/messages";
import { MONEY_DEPENDENT_KEYS, queryKeys } from "@/lib/query-keys";

type ResponseType = InferResponseType<
  (typeof client.api.recurring)[":id"]["$delete"]
>;

const messages = toastMessages("Recurring transaction");

export const useDeleteRecurring = (id?: string) => {
  const queryClient = useQueryClient();

  return useMutation<ResponseType, Error, { deleteTransactions: boolean }>({
    mutationFn: async ({ deleteTransactions }) => {
      const response = await client.api.recurring[":id"].$delete({
        param: { id },
        query: { deleteTransactions: String(deleteTransactions) },
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? messages.deleteError);
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success(messages.deleteSuccess);
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringItem(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring() });
      MONEY_DEPENDENT_KEYS.forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey })
      );
    },
    onError: () => {
      toast.error(messages.deleteError);
    },
  });
};
