import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";

import { CountUp } from "@/components/count-up";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency, formatPercentage } from "@/lib/utils";

const iconBox = cva(
  "flex size-9 shrink-0 items-center justify-center rounded-sm",
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

type IconBoxVariants = VariantProps<typeof iconBox>;

type Props = IconBoxVariants & {
  icon: LucideIcon;
  title: string;
  value?: number;
  dateRange: string;
  percentageChange?: number;
};

export const DataCard = ({
  icon: Icon,
  title,
  value = 0,
  variant,
  dateRange,
  percentageChange = 0,
}: Props) => {
  const TrendIcon = percentageChange < 0 ? TrendingDown : TrendingUp;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0 gap-x-4">
        <div className="min-w-0 space-y-1">
          <CardTitle className="line-clamp-1">{title}</CardTitle>
          <CardDescription className="line-clamp-1">
            {dateRange}
          </CardDescription>
        </div>
        <div className={cn(iconBox({ variant }))}>
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="numeric text-gray-1000 line-clamp-1 text-2xl font-semibold break-all">
          <CountUp
            preserveValue
            start={0}
            end={value}
            decimals={2}
            decimalPlaces={2}
            formattingFn={formatCurrency}
          />
        </p>
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
      </CardContent>
    </Card>
  );
};

export const DataCardLoading = () => {
  return (
    <Card className="h-[168px]">
      <CardHeader className="flex-row items-start justify-between space-y-0 gap-x-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="size-9 shrink-0" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-40" />
      </CardContent>
    </Card>
  );
};
