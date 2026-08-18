import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/hono";
import { toastMessages } from "@/lib/messages";
import { queryKeys } from "@/lib/query-keys";

type ResponseType = InferResponseType<
  (typeof client.api.budgets)["bulk-delete"]["$post"]
>;
type RequestType = InferRequestType<
  (typeof client.api.budgets)["bulk-delete"]["$post"]
>["json"];

const messages = toastMessages("Budget");

export const useBulkDeleteBudgets = () => {
  const queryClient = useQueryClient();

  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.budgets["bulk-delete"].$post({ json });

      return await response.json();
    },
    onSuccess: () => {
      toast.success(messages.bulkDeleteSuccess);
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets() });
    },
    onError: () => {
      toast.error(messages.bulkDeleteError);
    },
  });
};
