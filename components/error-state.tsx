"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  title?: string;
  description?: string;
  onRetry?: () => void;
};

export const ErrorState = ({
  title = "Something went wrong",
  description = "The data could not be loaded. Try again in a moment.",
  onRetry,
}: Props) => {
  return (
    <div className="flex flex-col items-center justify-center gap-y-3 px-6 py-14 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-red-100 text-red-900">
        <AlertTriangle className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="heading-14 text-gray-1000">{title}</p>
        <p className="copy-13 max-w-sm text-gray-900">{description}</p>
      </div>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry} className="mt-1">
          Try Again
        </Button>
      )}
    </div>
  );
};
