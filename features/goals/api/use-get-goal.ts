import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/hono";
import { queryKeys } from "@/lib/query-keys";
import { convertAmountFromMiliunits } from "@/lib/utils";

export const useGetGoal = (id?: string) => {
  return useQuery({
    enabled: !!id,
    queryKey: queryKeys.goal(id),
    queryFn: async () => {
      const response = await client.api.goals[":id"].$get({ param: { id } });

      if (!response.ok) {
        throw new Error("Failed to fetch goal");
      }

      const { data } = await response.json();

      return {
        ...data,
        targetAmount: convertAmountFromMiliunits(data.targetAmount),
        saved: convertAmountFromMiliunits(data.saved),
        remaining: convertAmountFromMiliunits(data.remaining),
        requiredPerMonth:
          data.requiredPerMonth === null
            ? null
            : convertAmountFromMiliunits(data.requiredPerMonth),
        averagePerMonth: convertAmountFromMiliunits(data.averagePerMonth),
        contributions: data.contributions.map((contribution) => ({
          ...contribution,
          amount: convertAmountFromMiliunits(contribution.amount),
        })),
      };
    },
  });
};
