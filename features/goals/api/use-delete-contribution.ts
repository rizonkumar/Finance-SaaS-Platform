import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/hono";
import { toastMessages } from "@/lib/messages";
import { queryKeys } from "@/lib/query-keys";

type ResponseType = InferResponseType<
  (typeof client.api.goals)[":id"]["contributions"][":contributionId"]["$delete"]
>;

const messages = toastMessages("Contribution");

export const useDeleteContribution = (id?: string) => {
  const queryClient = useQueryClient();

  return useMutation<ResponseType, Error, string>({
    mutationFn: async (contributionId) => {
      const response = await client.api.goals[":id"].contributions[
        ":contributionId"
      ].$delete({ param: { id, contributionId } });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? messages.deleteError);
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success(messages.deleteSuccess);
      queryClient.invalidateQueries({ queryKey: queryKeys.goal(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals() });
    },
    onError: (error) => {
      toast.error(error.message || messages.deleteError);
    },
  });
};
