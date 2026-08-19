import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/hono";
import { queryKeys } from "@/lib/query-keys";
import { convertAmountFromMiliunits } from "@/lib/utils";

export const useGetGoals = () => {
  return useQuery({
    queryKey: queryKeys.goals(),
    queryFn: async () => {
      const response = await client.api.goals.$get();

      if (!response.ok) {
        throw new Error("Failed to fetch goals");
      }

      const { data } = await response.json();

      return data.map((goal) => ({
        ...goal,
        targetAmount: convertAmountFromMiliunits(goal.targetAmount),
        saved: convertAmountFromMiliunits(goal.saved),
        remaining: convertAmountFromMiliunits(goal.remaining),
        requiredPerMonth:
          goal.requiredPerMonth === null
            ? null
            : convertAmountFromMiliunits(goal.requiredPerMonth),
        averagePerMonth: convertAmountFromMiliunits(goal.averagePerMonth),
      }));
    },
  });
};
