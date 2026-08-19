import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/hono";
import { queryKeys } from "@/lib/query-keys";

type ResponseType = InferResponseType<
  (typeof client.api.goals)[":id"]["contributions"]["$post"]
>;
type RequestType = InferRequestType<
  (typeof client.api.goals)[":id"]["contributions"]["$post"]
>["json"];

export const useAddContribution = (id?: string) => {
  const queryClient = useQueryClient();

  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.goals[":id"].contributions.$post({
        param: { id },
        json,
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Could not save that contribution");
      }

      return await response.json();
    },
    onSuccess: (_data, variables) => {
      toast.success(
        variables.amount < 0 ? "Withdrawal recorded" : "Contribution added"
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.goal(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals() });
    },
    onError: (error) => {
      toast.error(error.message || "Could not save that contribution");
    },
  });
};
