import { toast } from "sonner";
import { type InferRequestType, type InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/hono";
import { toastMessages } from "@/lib/messages";
import { queryKeys } from "@/lib/query-keys";

type ResponseType = InferResponseType<typeof client.api.categories.$post>;
type RequestType = InferRequestType<typeof client.api.categories.$post>["json"];

const messages = toastMessages("Category");

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.categories.$post({ json });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? messages.createError);
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success(messages.createSuccess);
      queryClient.invalidateQueries({ queryKey: queryKeys.categories() });
    },
    onError: (error) => {
      toast.error(error.message || messages.createError);
    },
  });

  return mutation;
};
