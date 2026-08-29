"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  compact?: boolean;
};

export const ErrorState = ({
  title = "Something went wrong",
  description = "The data could not be loaded. Try again in a moment.",
  onRetry,
  compact,
}: Props) => {
  return (
    <div
      className={cn(
        "flex",
        compact
          ? "items-center gap-x-3 py-6"
          : "flex-col items-center justify-center gap-y-3 px-6 py-14 text-center"
      )}
    >
      {compact ? (
        <AlertTriangle className="size-4 shrink-0 text-red-900" />
      ) : (
        <div className="flex size-10 items-center justify-center rounded-full bg-red-100 text-red-900">
          <AlertTriangle className="size-5" />
        </div>
      )}
      <div className={cn("space-y-1", compact && "min-w-0 flex-1")}>
        <p className="heading-14 text-gray-1000">{title}</p>
        <p className={cn("copy-13 text-gray-900", !compact && "max-w-sm")}>
          {description}
        </p>
      </div>
      {onRetry && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          className={compact ? "shrink-0" : "mt-1"}
        >
          Try Again
        </Button>
      )}
    </div>
  );
};
