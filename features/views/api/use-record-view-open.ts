import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/hono";
import { queryKeys } from "@/lib/query-keys";

export const useRecordViewOpen = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) =>
      client.api.views[":id"].open.$post({ param: { id } }),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.views() }),
  });

  return mutation.mutate;
};
