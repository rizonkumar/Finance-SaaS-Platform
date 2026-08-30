import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const COLUMNS = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-2 xl:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
} as const;

type Props = {
  count?: number;
  columns?: keyof typeof COLUMNS;
};

export const CardGridSkeleton = ({ count = 6, columns = 3 }: Props) => {
  return (
    <div className={cn("grid grid-cols-1 gap-4", COLUMNS[columns])}>
      {Array.from({ length: count }, (_, index) => `card-${index}`).map(
        (key) => (
          <Card key={key}>
            <CardHeader className="gap-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-4 w-40" />
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
};
