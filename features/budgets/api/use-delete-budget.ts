import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/hono";
import { toastMessages } from "@/lib/messages";
import { queryKeys } from "@/lib/query-keys";

type ResponseType = InferResponseType<
  (typeof client.api.budgets)[":id"]["$delete"]
>;

const messages = toastMessages("Budget");

export const useDeleteBudget = (id?: string) => {
  const queryClient = useQueryClient();

  return useMutation<ResponseType, Error>({
    mutationFn: async () => {
      const response = await client.api.budgets[":id"].$delete({
        param: { id },
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? messages.deleteError);
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success(messages.deleteSuccess);
      queryClient.invalidateQueries({ queryKey: queryKeys.budget(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets() });
    },
    onError: () => {
      toast.error(messages.deleteError);
    },
  });
};
