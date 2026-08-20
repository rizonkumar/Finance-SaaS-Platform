import { cn } from "@/lib/utils";

export const clampPercentage = (value: number) =>
  Math.min(Math.max(value, 0), 100);

type Props = {
  percentage: number;
  label: string;
  fillClassName: string;
  status?: string;
};

export const ProgressBar = ({
  percentage,
  label,
  fillClassName,
  status,
}: Props) => (
  <div
    role="progressbar"
    aria-valuenow={Math.round(percentage)}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-label={label}
    className="h-2 w-full overflow-hidden rounded-full bg-gray-200"
  >
    <div
      data-status={status}
      className={cn("h-full rounded-full transition-all", fillClassName)}
      style={{ width: `${clampPercentage(percentage)}%` }}
    />
  </div>
);
