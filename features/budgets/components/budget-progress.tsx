import { ProgressBar } from "@/components/progress-bar";
import type { BudgetStatus } from "@/lib/budgets";

type Props = {
  percentage: number;
  status: BudgetStatus;
};

export const BUDGET_FILL_TONE: Record<BudgetStatus, string> = {
  "on-track": "bg-green-700",
  warning: "bg-amber-700",
  over: "bg-red-700",
};

export const BudgetProgress = ({ percentage, status }: Props) => (
  <ProgressBar
    percentage={percentage}
    status={status}
    label="Budget used"
    fillClassName={BUDGET_FILL_TONE[status]}
  />
);
