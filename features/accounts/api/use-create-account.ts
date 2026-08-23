import { toast } from "sonner";
import { type InferRequestType, type InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/hono";
import { toastMessages } from "@/lib/messages";
import { MONEY_DEPENDENT_KEYS, queryKeys } from "@/lib/query-keys";

type ResponseType = InferResponseType<typeof client.api.accounts.$post>;
type RequestType = InferRequestType<typeof client.api.accounts.$post>["json"];

const messages = toastMessages("Account");

export const useCreateAccount = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.accounts.$post({ json });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? messages.createError);
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success(messages.createSuccess);
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts() });
      MONEY_DEPENDENT_KEYS.forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey })
      );
    },
    onError: (error) => {
      toast.error(error.message || messages.createError);
    },
  });

  return mutation;
};
