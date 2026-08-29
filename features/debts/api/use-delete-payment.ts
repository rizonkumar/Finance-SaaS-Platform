import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/hono";
import { toastMessages } from "@/lib/messages";
import {
  DEBT_DEPENDENT_KEYS,
  MONEY_DEPENDENT_KEYS,
  queryKeys,
} from "@/lib/query-keys";

type ResponseType = InferResponseType<
  (typeof client.api.debts)[":id"]["payments"][":paymentId"]["$delete"]
>;

const messages = toastMessages("Payment");

export const useDeletePayment = (id?: string) => {
  const queryClient = useQueryClient();

  return useMutation<ResponseType, Error, string>({
    mutationFn: async (paymentId) => {
      const response = await client.api.debts[":id"].payments[
        ":paymentId"
      ].$delete({ param: { id, paymentId } });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? messages.deleteError);
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success(messages.deleteSuccess);
      queryClient.invalidateQueries({ queryKey: queryKeys.debt(id) });
      [...DEBT_DEPENDENT_KEYS, ...MONEY_DEPENDENT_KEYS].forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey })
      );
    },
    onError: (error) => {
      toast.error(error.message || messages.deleteError);
    },
  });
};
