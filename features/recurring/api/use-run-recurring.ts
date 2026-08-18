import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/hono";
import { MONEY_DEPENDENT_KEYS, queryKeys } from "@/lib/query-keys";

type ResponseType = InferResponseType<
  (typeof client.api.recurring)[":id"]["run"]["$post"]
>;

export const useRunRecurring = (id?: string) => {
  const queryClient = useQueryClient();

  return useMutation<ResponseType, Error>({
    mutationFn: async () => {
      const response = await client.api.recurring[":id"].run.$post({
        param: { id },
      });

      return await response.json();
    },
    onSuccess: (result) => {
      const inserted = result.data?.inserted ?? 0;

      toast.success(
        inserted > 0
          ? `${inserted} transactions generated`
          : "Nothing due right now"
      );

      queryClient.invalidateQueries({ queryKey: queryKeys.recurring() });
      MONEY_DEPENDENT_KEYS.forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey })
      );
    },
    onError: () => {
      toast.error("Could not generate transactions");
    },
  });
};
