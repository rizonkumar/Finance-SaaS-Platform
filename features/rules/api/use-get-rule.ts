import { useQuery } from "@tanstack/react-query";
import { type InferResponseType } from "hono";

import { parseResponse } from "@/lib/api-response";
import { client } from "@/lib/hono";
import { queryKeys } from "@/lib/query-keys";

type ResponseType = InferResponseType<
  (typeof client.api.rules)[":id"]["$get"],
  200
>;

export const useGetRule = (id?: string) =>
  useQuery({
    enabled: !!id,
    queryKey: queryKeys.rule(id),
    queryFn: async () => {
      const { data } = await parseResponse<ResponseType>(
        await client.api.rules[":id"].$get({ param: { id } }),
        "Failed to fetch rule"
      );

      return data;
    },
  });
