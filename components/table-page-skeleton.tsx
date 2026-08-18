import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const TablePageSkeleton = () => {
  return (
    <Card>
      <CardHeader className="gap-y-2 lg:flex-row lg:items-center lg:justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-8 w-28" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-10 w-full max-w-sm" />
        {Array.from({ length: 8 }, (_, index) => `row-${index}`).map((key) => (
          <Skeleton key={key} className="h-11 w-full" />
        ))}
      </CardContent>
    </Card>
  );
};
