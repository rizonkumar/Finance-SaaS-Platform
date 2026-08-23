import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const TablePageSkeleton = () => {
  return (
    <>
      <div className="mb-4 flex flex-col gap-y-3">
        <div className="flex items-start justify-between gap-x-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-8 w-32 shrink-0" />
        </div>
        <Skeleton className="h-7 w-28 rounded-full" />
      </div>
      <Card>
        <CardContent className="space-y-3 pt-5">
          <Skeleton className="ml-auto h-9 w-full sm:w-64" />
          {Array.from({ length: 8 }, (_, index) => `row-${index}`).map(
            (key) => (
              <Skeleton key={key} className="h-11 w-full" />
            )
          )}
        </CardContent>
      </Card>
    </>
  );
};
