"use client";

import { Suspense } from "react";
import { ClerkLoaded, ClerkLoading, UserButton } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";

import { Filters } from "@/components/filters";
import { MobileNav } from "@/components/mobile-nav";
import { Skeleton } from "@/components/ui/skeleton";
import { FILTERED_ROUTES, PAGE_TITLES } from "@/lib/routes";

export const AppTopbar = () => {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Fintrack";
  const showFilters = FILTERED_ROUTES.includes(pathname);

  return (
    <header className="border-alpha-300 bg-canvas/70 z-30 flex min-h-14 shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b px-4 py-2.5 backdrop-blur-xl lg:px-6">
      <div className="lg:hidden">
        <MobileNav />
      </div>

      <h1 className="heading-16 text-gray-1000 mr-auto">{title}</h1>

      {showFilters && (
        <Suspense fallback={<Skeleton className="h-8 w-64" />}>
          <Filters />
        </Suspense>
      )}

      <div className="lg:hidden">
        <ClerkLoaded>
          <UserButton />
        </ClerkLoaded>
        <ClerkLoading>
          <Loader2 className="size-7 animate-spin text-gray-600" />
        </ClerkLoading>
      </div>
    </header>
  );
};
