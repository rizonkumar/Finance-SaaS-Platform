"use client";

import { ErrorState } from "@/components/error-state";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  reset: () => void;
};

const DashboardError = ({ reset }: Props) => {
  return (
    <Card>
      <CardContent>
        <ErrorState
          description="This page could not be displayed. Try again in a moment."
          onRetry={reset}
        />
      </CardContent>
    </Card>
  );
};

export default DashboardError;
