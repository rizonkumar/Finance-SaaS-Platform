import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/hono";
import { toastMessages } from "@/lib/messages";
import { queryKeys } from "@/lib/query-keys";

type ResponseType = InferResponseType<
  (typeof client.api.debts)[":id"]["$patch"]
>;
type RequestType = InferRequestType<
  (typeof client.api.debts)[":id"]["$patch"]
>["json"];

const messages = toastMessages("Debt");

export const useEditDebt = (id?: string) => {
  const queryClient = useQueryClient();

  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.debts[":id"].$patch({
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
      queryClient.invalidateQueries({ queryKey: queryKeys.debt(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.debts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.debtPlans() });
    },
    onError: (error) => {
      toast.error(error.message || messages.updateError);
    },
  });
};
