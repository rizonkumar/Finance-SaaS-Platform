import { toast } from "sonner";
import { type InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/hono";
import { toastMessages } from "@/lib/messages";
import { queryKeys } from "@/lib/query-keys";

type ResponseType = InferResponseType<
  (typeof client.api.categories)[":id"]["$delete"]
>;

const messages = toastMessages("Category");

export const useDeleteCategory = (id?: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error>({
    mutationFn: async () => {
      const response = await client.api.categories[":id"]["$delete"]({
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
      queryClient.invalidateQueries({ queryKey: queryKeys.category(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories() });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.summary() });
    },
    onError: (error) => {
      toast.error(error.message || messages.deleteError);
    },
  });

  return mutation;
};
