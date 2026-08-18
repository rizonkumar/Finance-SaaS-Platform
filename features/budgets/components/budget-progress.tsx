import type { BudgetStatus } from "@/lib/budgets";
import { cn } from "@/lib/utils";

type Props = {
  percentage: number;
  status: BudgetStatus;
};

const TRACK_TONE: Record<BudgetStatus, string> = {
  "on-track": "bg-green-700",
  warning: "bg-amber-700",
  over: "bg-red-700",
};

export const BudgetProgress = ({ percentage, status }: Props) => {
  const width = Math.min(Math.max(percentage, 0), 100);

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(percentage)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Budget used"
      className="h-2 w-full overflow-hidden rounded-full bg-gray-200"
    >
      <div
        data-status={status}
        className={cn("h-full rounded-full transition-all", TRACK_TONE[status])}
        style={{ width: `${width}%` }}
      />
    </div>
  );
};
