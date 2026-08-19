import type { GoalStatus } from "@/lib/goals";
import { cn } from "@/lib/utils";

type Props = {
  percentage: number;
  expectedPercentage: number | null;
  status: GoalStatus;
};

const FILL_TONE: Record<GoalStatus, string> = {
  completed: "bg-green-700",
  ahead: "bg-green-700",
  "on-track": "bg-blue-700",
  behind: "bg-amber-700",
  "no-deadline": "bg-gray-600",
};

const clamp = (value: number) => Math.min(Math.max(value, 0), 100);

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
      <div
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Goal funded"
        className="h-2 w-full overflow-hidden rounded-full bg-gray-200"
      >
        <div
          data-status={status}
          className={cn(
            "h-full rounded-full transition-all",
            FILL_TONE[status]
          )}
          style={{ width: `${clamp(percentage)}%` }}
        />
      </div>
      {showMarker && (
        <div
          aria-hidden
          title={`Expected by now: ${Math.round(expectedPercentage)}%`}
          className="bg-gray-1000 ring-surface absolute top-0 h-4 w-0.5 -translate-x-1/2 rounded-full opacity-70 ring-2"
          style={{ left: `${clamp(expectedPercentage)}%` }}
        />
      )}
    </div>
  );
};
