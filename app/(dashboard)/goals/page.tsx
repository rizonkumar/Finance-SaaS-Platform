"use client";

import { Plus, Target } from "lucide-react";

import { CardGridSkeleton } from "@/components/card-grid-skeleton";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGetGoals } from "@/features/goals/api/use-get-goals";
import { GoalCard } from "@/features/goals/components/goal-card";
import { useContributeGoal } from "@/features/goals/hooks/use-contribute-goal";
import { useNewGoal } from "@/features/goals/hooks/use-new-goal";
import { useOpenGoal } from "@/features/goals/hooks/use-open-goal";
import { formatCurrency } from "@/lib/utils";

const GoalsPage = () => {
  const newGoal = useNewGoal();
  const openGoal = useOpenGoal();
  const contributeGoal = useContributeGoal();
  const goalsQuery = useGetGoals();

  if (goalsQuery.isLoading) {
    return <CardGridSkeleton />;
  }

  if (goalsQuery.isError) {
    return (
      <Card>
        <CardContent>
          <ErrorState onRetry={() => goalsQuery.refetch()} />
        </CardContent>
      </Card>
    );
  }

  const goals = goalsQuery.data ?? [];
  const totalSaved = goals.reduce((sum, goal) => sum + goal.saved, 0);
  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-x-2">
        <p className="copy-14 text-gray-900">
          {goals.length} {goals.length === 1 ? "goal" : "goals"}
          {goals.length > 0 && (
            <>
              {" · "}
              <span className="numeric">
                {formatCurrency(totalSaved)}
              </span> of{" "}
              <span className="numeric">{formatCurrency(totalTarget)}</span>{" "}
              saved
            </>
          )}
        </p>
        <Button size="sm" onClick={newGoal.onOpen}>
          <Plus className="size-4" />
          Add Goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Target}
              title="No goals yet"
              description="Set a target to save towards and see whether you are keeping pace with the deadline."
              actionLabel="Add Goal"
              onAction={newGoal.onOpen}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              {...goal}
              onEdit={openGoal.onOpen}
              onContribute={contributeGoal.onOpen}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default GoalsPage;
