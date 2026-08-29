"use client";

import { ErrorState } from "@/components/error-state";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  reset: () => void;
};

const AppError = ({ reset }: Props) => {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-6">
      <Card className="w-full max-w-md">
        <CardContent>
          <ErrorState
            description="This page could not be displayed. Try again in a moment."
            onRetry={reset}
          />
        </CardContent>
      </Card>
    </main>
  );
};

export default AppError;
