import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/hono";
import { toastMessages } from "@/lib/messages";
import { queryKeys } from "@/lib/query-keys";

type ResponseType = InferResponseType<typeof client.api.holdings.$post>;
type RequestType = InferRequestType<typeof client.api.holdings.$post>["json"];

const messages = toastMessages("Holding");

export const useCreateHolding = () => {
  const queryClient = useQueryClient();

  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.holdings.$post({ json });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? messages.createError);
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success(messages.createSuccess);
      queryClient.invalidateQueries({ queryKey: queryKeys.holdings() });
    },
    onError: (error) => {
      toast.error(error.message || messages.createError);
    },
  });
};
