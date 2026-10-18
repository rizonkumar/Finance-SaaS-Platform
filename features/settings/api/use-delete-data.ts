import { type InferResponseType } from "hono";
import { useQueryClient } from "@tanstack/react-query";

import { useApiMutation } from "@/hooks/use-api-mutation";
import { parseResponse } from "@/lib/api-response";
import { client } from "@/lib/hono";

type ResponseType = InferResponseType<
  typeof client.api.settings.data.$delete,
  200
>;

const DELETE_ERROR = "Could not delete your data";

export const useDeleteData = () => {
  const queryClient = useQueryClient();

  return useApiMutation<ResponseType>({
    mutationFn: async () =>
      parseResponse(await client.api.settings.data.$delete(), DELETE_ERROR),
    successMessage: "All of your data has been deleted",
    errorMessage: DELETE_ERROR,
    invalidateKeys: [],
    onSuccess: () => queryClient.resetQueries(),
  });
};
