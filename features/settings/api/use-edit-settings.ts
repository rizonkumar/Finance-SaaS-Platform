import { type InferRequestType, type InferResponseType } from "hono";

import { useApiMutation } from "@/hooks/use-api-mutation";
import { parseResponse } from "@/lib/api-response";
import { client } from "@/lib/hono";
import { queryKeys } from "@/lib/query-keys";

type ResponseType = InferResponseType<typeof client.api.settings.$patch, 200>;
type RequestType = InferRequestType<typeof client.api.settings.$patch>["json"];

const SAVE_ERROR = "Could not save your settings";

export const useEditSettings = () =>
  useApiMutation<ResponseType, RequestType>({
    mutationFn: async (json) =>
      parseResponse(await client.api.settings.$patch({ json }), SAVE_ERROR),
    successMessage: "Settings saved",
    errorMessage: SAVE_ERROR,
    invalidateKeys: [queryKeys.settings(), queryKeys.budgets()],
  });
