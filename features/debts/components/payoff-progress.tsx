import type { DebtStatus } from "@/lib/debts";
import { cn } from "@/lib/utils";

type Props = {
  percentage: number;
  status: DebtStatus;
};

const FILL_TONE: Record<DebtStatus, string> = {
  cleared: "bg-green-700",
  ahead: "bg-green-700",
  "on-track": "bg-blue-700",
  behind: "bg-amber-700",
  stalled: "bg-red-700",
  "no-deadline": "bg-gray-600",
};

const clamp = (value: number) => Math.min(Math.max(value, 0), 100);

export const PayoffProgress = ({ percentage, status }: Props) => (
  <div className="py-1">
    <div
      role="progressbar"
      aria-valuenow={Math.round(percentage)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Debt cleared"
      className="h-2 w-full overflow-hidden rounded-full bg-gray-200"
    >
      <div
        data-status={status}
        className={cn("h-full rounded-full transition-all", FILL_TONE[status])}
        style={{ width: `${clamp(percentage)}%` }}
      />
    </div>
  </div>
);
