import { type InferResponseType } from "hono";

import { useApiMutation } from "@/hooks/use-api-mutation";
import { parseResponse } from "@/lib/api-response";
import { client } from "@/lib/hono";
import { toastMessages } from "@/lib/messages";
import { queryKeys } from "@/lib/query-keys";

type ResponseType = InferResponseType<
  (typeof client.api.rules)[":id"]["$delete"],
  200
>;

const messages = toastMessages("Rule");

export const useDeleteRule = () =>
  useApiMutation<ResponseType, string>({
    mutationFn: async (id) =>
      parseResponse(
        await client.api.rules[":id"].$delete({ param: { id } }),
        messages.deleteError
      ),
    successMessage: messages.deleteSuccess,
    errorMessage: messages.deleteError,
    invalidateKeys: [queryKeys.rules()],
  });
