"use client";

import { Target } from "lucide-react";

import { GlanceCard } from "@/components/glance-card";
import { useGetGoals } from "@/features/goals/api/use-get-goals";
import { GOAL_FILL_TONE } from "@/features/goals/components/goal-progress";
import { formatCurrency } from "@/lib/utils";

export const GoalsGlanceCard = () => {
  const goalsQuery = useGetGoals();
  const goals = goalsQuery.data ?? [];

  const items = goals.map((goal) => ({
    id: goal.id,
    title: goal.name,
    amountLabel: `${formatCurrency(goal.saved)} / ${formatCurrency(goal.targetAmount)}`,
    percentage: goal.percentage,
    fillClassName: GOAL_FILL_TONE[goal.status],
  }));

  return (
    <GlanceCard
      title="Goals"
      href="/goals"
      items={items}
      isLoading={goalsQuery.isLoading}
      emptyIcon={Target}
      emptyTitle="No goals yet"
      emptyDescription="Set a target to save towards."
    />
  );
};
