import { type InferRequestType, type InferResponseType } from "hono";

import { useApiMutation } from "@/hooks/use-api-mutation";
import { parseResponse } from "@/lib/api-response";
import { client } from "@/lib/hono";
import { toastMessages } from "@/lib/messages";
import { queryKeys } from "@/lib/query-keys";

type Endpoint = (typeof client.api.rules)[":id"]["$patch"];
type ResponseType = InferResponseType<Endpoint, 200>;
type RequestType = InferRequestType<Endpoint>["json"];

const messages = toastMessages("Rule");

export const useEditRule = (id?: string) =>
  useApiMutation<ResponseType, RequestType>({
    mutationFn: async (json) =>
      parseResponse(
        await client.api.rules[":id"].$patch({ param: { id }, json }),
        messages.updateError
      ),
    successMessage: messages.updateSuccess,
    errorMessage: messages.updateError,
    invalidateKeys: [queryKeys.rules(), queryKeys.rule(id)],
  });
