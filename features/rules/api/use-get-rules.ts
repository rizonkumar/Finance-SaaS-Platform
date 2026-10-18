import { useQuery } from "@tanstack/react-query";
import { type InferResponseType } from "hono";

import { parseResponse } from "@/lib/api-response";
import { client } from "@/lib/hono";
import { queryKeys } from "@/lib/query-keys";

type ResponseType = InferResponseType<typeof client.api.rules.$get, 200>;

export const useGetRules = () =>
  useQuery({
    queryKey: queryKeys.rules(),
    queryFn: async () => {
      const { data } = await parseResponse<ResponseType>(
        await client.api.rules.$get(),
        "Failed to fetch rules"
      );

      return data;
    },
  });
