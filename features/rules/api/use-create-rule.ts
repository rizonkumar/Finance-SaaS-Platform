import { type InferRequestType, type InferResponseType } from "hono";

import { useApiMutation } from "@/hooks/use-api-mutation";
import { parseResponse } from "@/lib/api-response";
import { client } from "@/lib/hono";
import { toastMessages } from "@/lib/messages";
import { queryKeys } from "@/lib/query-keys";

type ResponseType = InferResponseType<typeof client.api.rules.$post, 200>;
type RequestType = InferRequestType<typeof client.api.rules.$post>["json"];

const messages = toastMessages("Rule");

export const useCreateRule = () =>
  useApiMutation<ResponseType, RequestType>({
    mutationFn: async (json) =>
      parseResponse(
        await client.api.rules.$post({ json }),
        messages.createError
      ),
    successMessage: messages.createSuccess,
    errorMessage: messages.createError,
    invalidateKeys: [queryKeys.rules()],
  });
