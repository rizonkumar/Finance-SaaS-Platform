import { clampPercentage, ProgressBar } from "@/components/progress-bar";
import type { GoalStatus } from "@/lib/goals";

type Props = {
  percentage: number;
  expectedPercentage: number | null;
  status: GoalStatus;
};

export const GOAL_FILL_TONE: Record<GoalStatus, string> = {
  completed: "bg-green-700",
  ahead: "bg-green-700",
  "on-track": "bg-blue-700",
  behind: "bg-amber-700",
  "no-deadline": "bg-gray-600",
};

export const GoalProgress = ({
  percentage,
  expectedPercentage,
  status,
}: Props) => {
  const showMarker =
    expectedPercentage !== null &&
    status !== "completed" &&
    status !== "no-deadline";

  return (
    <div className="relative py-1">
      <ProgressBar
        percentage={percentage}
        status={status}
        label="Goal funded"
        fillClassName={GOAL_FILL_TONE[status]}
      />
      {showMarker && (
        <div
          aria-hidden
          title={`Expected by now: ${Math.round(expectedPercentage)}%`}
          className="bg-gray-1000 ring-surface absolute top-0 h-4 w-0.5 -translate-x-1/2 rounded-full opacity-70 ring-2"
          style={{ left: `${clampPercentage(expectedPercentage)}%` }}
        />
      )}
    </div>
  );
};
