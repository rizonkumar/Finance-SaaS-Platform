import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  count?: number;
};

export const CardGridSkeleton = ({ count = 6 }: Props) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
