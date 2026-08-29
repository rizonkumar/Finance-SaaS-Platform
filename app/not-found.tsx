import Link from "next/link";
import { Compass } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const NotFound = () => {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-6">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center">
          <EmptyState
            icon={Compass}
            title="Page not found"
            description="The page you are looking for does not exist or has been moved."
          />
          <Button asChild size="sm" variant="outline">
            <Link href="/">Back to overview</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
};

export default NotFound;
