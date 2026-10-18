import { type InferRequestType, type InferResponseType } from "hono";

import { useApiMutation } from "@/hooks/use-api-mutation";
import { parseResponse } from "@/lib/api-response";
import { client } from "@/lib/hono";
import { toastMessages } from "@/lib/messages";
import { queryKeys } from "@/lib/query-keys";

type Endpoint = (typeof client.api.views)[":id"]["$patch"];
type ResponseType = InferResponseType<Endpoint, 200>;
type RequestType = InferRequestType<Endpoint>["json"];

const messages = toastMessages("View");

export const useEditView = () =>
  useApiMutation<ResponseType, RequestType & { id: string }>({
    mutationFn: async ({ id, ...json }) =>
      parseResponse(
        await client.api.views[":id"].$patch({ param: { id }, json }),
        messages.updateError
      ),
    errorMessage: messages.updateError,
    invalidateKeys: [queryKeys.views()],
  });
