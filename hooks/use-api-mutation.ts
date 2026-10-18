import { toast } from "sonner";
import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";

type Options<TResponse, TRequest> = {
  mutationFn: (request: TRequest) => Promise<TResponse>;
  successMessage?: string | ((response: TResponse) => string);
  errorMessage: string;
  invalidateKeys: readonly QueryKey[];
  onSuccess?: (response: TResponse) => void;
};

export const useApiMutation = <TResponse, TRequest = void>({
  mutationFn,
  successMessage,
  errorMessage,
  invalidateKeys,
  onSuccess,
}: Options<TResponse, TRequest>) => {
  const queryClient = useQueryClient();

  return useMutation<TResponse, Error, TRequest>({
    mutationFn,
    onSuccess: (response) => {
      const message =
        typeof successMessage === "function"
          ? successMessage(response)
          : successMessage;

      if (message) toast.success(message);

      invalidateKeys.forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey })
      );
      onSuccess?.(response);
    },
    onError: (error) => {
      toast.error(error.message || errorMessage);
    },
  });
};
