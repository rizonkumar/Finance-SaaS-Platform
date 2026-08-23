import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";

import { CountUp } from "@/components/count-up";
import { Sparkline } from "@/components/sparkline";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency, formatPercentage } from "@/lib/utils";

export const iconBox = cva(
  "flex shrink-0 items-center justify-center rounded-sm",
  {
    variants: {
      variant: {
        default: "bg-blue-100 text-blue-900",
        success: "bg-green-100 text-green-900",
        danger: "bg-red-100 text-red-900",
        warning: "bg-amber-100 text-amber-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type IconBoxVariants = VariantProps<typeof iconBox>;

const SPARK_COLOR = {
  default: "var(--blue-700)",
  success: "var(--green-700)",
  danger: "var(--red-700)",
  warning: "var(--amber-700)",
} as const;

export const DATA_CARD_HEIGHT = 134;

type Props = IconBoxVariants & {
  icon: LucideIcon;
  title: string;
  value?: number;
  percentageChange?: number;
  subtitle?: string;
  trend?: number[];
};

export const DataCard = ({
  icon: Icon,
  title,
  value = 0,
  variant,
  percentageChange = 0,
  subtitle,
  trend,
}: Props) => {
  const TrendIcon = percentageChange < 0 ? TrendingDown : TrendingUp;

  return (
    <Card
      className="flex flex-col justify-between gap-y-3 p-4"
      style={{ height: DATA_CARD_HEIGHT }}
    >
      <div className="flex items-start justify-between gap-x-3">
        <p className="label-13 line-clamp-1 text-gray-900">{title}</p>
        <div className={cn(iconBox({ variant }), "size-7")}>
          <Icon className="size-3.5" />
        </div>
      </div>

      <div className="flex items-end justify-between gap-x-3">
        <p className="numeric heading-24 text-gray-1000 min-w-0 break-all">
          <CountUp
            preserveValue
            start={0}
            end={value}
            decimals={2}
            decimalPlaces={2}
            formattingFn={formatCurrency}
          />
        </p>
        {trend && (
          <Sparkline data={trend} color={SPARK_COLOR[variant ?? "default"]} />
        )}
      </div>

      {subtitle !== undefined ? (
        <p className="copy-13 line-clamp-1 text-gray-900">{subtitle}</p>
      ) : (
        <p
          className={cn(
            "copy-13 line-clamp-1 flex items-center gap-x-1",
            percentageChange > 0 && "text-green-900",
            percentageChange < 0 && "text-red-900",
            percentageChange === 0 && "text-gray-900"
          )}
        >
          {percentageChange !== 0 && (
            <TrendIcon className="size-3.5 shrink-0" />
          )}
          <span className="numeric text-xs">
            {formatPercentage(percentageChange, { addPrefix: true })}
          </span>
          <span className="text-gray-900">from last period</span>
        </p>
      )}
    </Card>
  );
};

export const DataCardLoading = () => {
  return (
    <Card
      className="flex flex-col justify-between gap-y-3 p-4"
      style={{ height: DATA_CARD_HEIGHT }}
    >
      <div className="flex items-start justify-between gap-x-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="size-7 shrink-0" />
      </div>
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-4 w-40" />
    </Card>
  );
};
