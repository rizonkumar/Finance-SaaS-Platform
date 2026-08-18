import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/hono";
import { toastMessages } from "@/lib/messages";
import { queryKeys } from "@/lib/query-keys";

type ResponseType = InferResponseType<
  (typeof client.api.budgets)[":id"]["$patch"]
>;
type RequestType = InferRequestType<
  (typeof client.api.budgets)[":id"]["$patch"]
>["json"];

const messages = toastMessages("Budget");

export const useEditBudget = (id?: string) => {
  const queryClient = useQueryClient();

  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.budgets[":id"].$patch({
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
      queryClient.invalidateQueries({ queryKey: queryKeys.budget(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets() });
    },
    onError: (error) => {
      toast.error(error.message || messages.updateError);
    },
  });
};
