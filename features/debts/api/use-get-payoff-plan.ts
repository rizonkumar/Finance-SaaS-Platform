import { useQuery } from "@tanstack/react-query";
import type { InferResponseType } from "hono";

import { client } from "@/lib/hono";
import { queryKeys } from "@/lib/query-keys";
import {
  convertAmountFromMiliunits,
  convertAmountToMiliunits,
} from "@/lib/utils";

type Plan = InferResponseType<
  typeof client.api.debts.plan.$get,
  200
>["data"]["snowball"];

const normalizePlan = (plan: Plan) => ({
  ...plan,
  totalInterest: convertAmountFromMiliunits(plan.totalInterest),
  totalPaid: convertAmountFromMiliunits(plan.totalPaid),
  order: plan.order.map((entry) => ({
    ...entry,
    interestPaid: convertAmountFromMiliunits(entry.interestPaid),
  })),
});

export const useGetPayoffPlan = (extra: number) => {
  return useQuery({
    queryKey: queryKeys.debtPlan(extra),
    queryFn: async () => {
      const response = await client.api.debts.plan.$get({
        query: { extra: String(convertAmountToMiliunits(extra)) },
      });

      if (!response.ok) {
        throw new Error("Failed to build a payoff plan");
      }

      const { data } = await response.json();

      return {
        recommended: data.recommended,
        minimumTotal: convertAmountFromMiliunits(data.minimumTotal),
        interestSaved: convertAmountFromMiliunits(data.interestSaved),
        monthsSaved: data.monthsSaved,
        snowball: normalizePlan(data.snowball),
        avalanche: normalizePlan(data.avalanche),
      };
    },
  });
};
