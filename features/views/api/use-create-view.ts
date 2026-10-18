import { type InferRequestType, type InferResponseType } from "hono";

import { useApiMutation } from "@/hooks/use-api-mutation";
import { parseResponse } from "@/lib/api-response";
import { client } from "@/lib/hono";
import { toastMessages } from "@/lib/messages";
import { queryKeys } from "@/lib/query-keys";

type ResponseType = InferResponseType<typeof client.api.views.$post, 200>;
type RequestType = InferRequestType<typeof client.api.views.$post>["json"];

const messages = toastMessages("View");

export const useCreateView = () =>
  useApiMutation<ResponseType, RequestType>({
    mutationFn: async (json) =>
      parseResponse(
        await client.api.views.$post({ json }),
        messages.createError
      ),
    successMessage: "View saved",
    errorMessage: messages.createError,
    invalidateKeys: [queryKeys.views()],
  });
