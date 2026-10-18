import { useQuery } from "@tanstack/react-query";
import { type InferResponseType } from "hono";

import { parseResponse } from "@/lib/api-response";
import { client } from "@/lib/hono";
import { queryKeys } from "@/lib/query-keys";

type ResponseType = InferResponseType<typeof client.api.settings.$get, 200>;

export const useGetSettings = ({ enabled = true } = {}) =>
  useQuery({
    enabled,
    queryKey: queryKeys.settings(),
    staleTime: Infinity,
    queryFn: async () => {
      const { data } = await parseResponse<ResponseType>(
        await client.api.settings.$get(),
        "Failed to fetch settings"
      );

      return data;
    },
  });
