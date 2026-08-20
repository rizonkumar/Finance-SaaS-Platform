import { ProgressBar } from "@/components/progress-bar";
import type { DebtStatus } from "@/lib/debts";

type Props = {
  percentage: number;
  status: DebtStatus;
};

export const DEBT_FILL_TONE: Record<DebtStatus, string> = {
  cleared: "bg-green-700",
  ahead: "bg-green-700",
  "on-track": "bg-blue-700",
  behind: "bg-amber-700",
  stalled: "bg-red-700",
  "no-deadline": "bg-gray-600",
};

export const PayoffProgress = ({ percentage, status }: Props) => (
  <div className="py-1">
    <ProgressBar
      percentage={percentage}
      status={status}
      label="Debt cleared"
      fillClassName={DEBT_FILL_TONE[status]}
    />
  </div>
);
