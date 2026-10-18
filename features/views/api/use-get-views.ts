import { useQuery } from "@tanstack/react-query";
import { type InferResponseType } from "hono";

import { parseResponse } from "@/lib/api-response";
import { client } from "@/lib/hono";
import { queryKeys } from "@/lib/query-keys";

type ResponseType = InferResponseType<typeof client.api.views.$get, 200>;

export type SavedView = ResponseType["data"][number];

export const useGetViews = () =>
  useQuery({
    queryKey: queryKeys.views(),
    queryFn: async () => {
      const { data } = await parseResponse<ResponseType>(
        await client.api.views.$get(),
        "Failed to fetch saved views"
      );

      return data;
    },
  });
