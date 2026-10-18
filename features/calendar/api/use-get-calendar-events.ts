import { useQuery } from "@tanstack/react-query";
import { type InferResponseType } from "hono";

import { parseResponse } from "@/lib/api-response";
import { client } from "@/lib/hono";
import { queryKeys } from "@/lib/query-keys";
import { convertAmountFromMiliunits } from "@/lib/utils";

type ResponseType = InferResponseType<
  typeof client.api.forecast.events.$get,
  200
>;

type Range = {
  from: string;
  to: string;
  accountId: string;
};

export const useGetCalendarEvents = (range: Range) =>
  useQuery({
    queryKey: [...queryKeys.forecastEvents(), range],
    queryFn: async () => {
      const { data } = await parseResponse<ResponseType>(
        await client.api.forecast.events.$get({ query: range }),
        "Failed to fetch upcoming bills"
      );

      return data.map((event) => ({
        ...event,
        date: new Date(event.date),
        amount: convertAmountFromMiliunits(event.amount),
      }));
    },
  });
