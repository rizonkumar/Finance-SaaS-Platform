import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { ProgressBar } from "@/components/progress-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const MAX_ITEMS = 3;

export type GlanceItem = {
  id: string;
  title: string;
  amountLabel: string;
  percentage: number;
  fillClassName: string;
};

type Props = {
  title: string;
  href: string;
  items: GlanceItem[];
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
};

export const GlanceCard = ({
  title,
  href,
  items,
  isLoading,
  isError,
  onRetry,
  emptyIcon,
  emptyTitle,
  emptyDescription,
}: Props) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState onRetry={onRetry} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>{title}</CardTitle>
        <Link href={href} className="copy-13 text-blue-800 hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
          />
        ) : (
          <ul className="space-y-4">
            {items.slice(0, MAX_ITEMS).map((item) => (
              <li key={item.id} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-x-2">
                  <span className="copy-13 text-gray-1000 line-clamp-1 font-medium">
                    {item.title}
                  </span>
                  <span className="copy-13 numeric shrink-0 text-gray-900">
                    {item.amountLabel}
                  </span>
                </div>
                <ProgressBar
                  percentage={item.percentage}
                  label={item.title}
                  fillClassName={item.fillClassName}
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
