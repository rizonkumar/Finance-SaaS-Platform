import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/hono";
import { toastMessages } from "@/lib/messages";
import { queryKeys } from "@/lib/query-keys";

type ResponseType = InferResponseType<
  (typeof client.api.goals)[":id"]["$delete"]
>;

const messages = toastMessages("Goal");

export const useDeleteGoal = (id?: string) => {
  const queryClient = useQueryClient();

  return useMutation<ResponseType, Error>({
    mutationFn: async () => {
      const response = await client.api.goals[":id"].$delete({
        param: { id },
      });

      return await response.json();
    },
    onSuccess: () => {
      toast.success(messages.deleteSuccess);
      queryClient.invalidateQueries({ queryKey: queryKeys.goal(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals() });
    },
    onError: () => {
      toast.error(messages.deleteError);
    },
  });
};
