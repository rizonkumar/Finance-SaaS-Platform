import { useQuery } from "@tanstack/react-query";
import { type InferResponseType } from "hono";
import { useSearchParams } from "next/navigation";

import { parseResponse } from "@/lib/api-response";
import { client } from "@/lib/hono";
import { queryKeys } from "@/lib/query-keys";
import { convertAmountFromMiliunits, timezoneOffset } from "@/lib/utils";

type ResponseType = InferResponseType<typeof client.api.reports.$get, 200>;

const toUnits = convertAmountFromMiliunits;

export const useGetReports = () => {
  const params = useSearchParams();
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const accountId = params.get("accountId") || "";

  return useQuery({
    queryKey: [...queryKeys.reports(), { from, to, accountId }],
    queryFn: async () => {
      const { data } = await parseResponse<ResponseType>(
        await client.api.reports.$get({
          query: { from, to, accountId, tzOffset: timezoneOffset() },
        }),
        "Failed to fetch reports"
      );

      return {
        months: data.months,
        totals: {
          ...data.totals,
          income: toUnits(data.totals.income),
          expenses: toUnits(data.totals.expenses),
          net: toUnits(data.totals.net),
        },
        monthly: data.monthly.map((flow) => ({
          month: flow.month,
          income: toUnits(flow.income),
          expenses: toUnits(flow.expenses),
          net: toUnits(flow.net),
        })),
        categories: data.categories.map((row) => ({
          category: row.category,
          total: toUnits(row.total),
          values: row.values.map(toUnits),
        })),
        payees: data.payees.map((payee) => ({
          ...payee,
          total: toUnits(payee.total),
        })),
      };
    },
  });
};

export type ReportData = NonNullable<ReturnType<typeof useGetReports>["data"]>;
