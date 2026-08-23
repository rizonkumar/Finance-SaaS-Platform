"use client";

import { ClerkLoaded, ClerkLoading, UserButton, useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";

export const SidebarUserCard = () => {
  const { user } = useUser();

  const name = user?.fullName ?? user?.username ?? "Your account";
  const secondary = user?.primaryEmailAddress?.emailAddress;

  return (
    <div className="border-alpha-300 bg-alpha-100 flex items-center gap-x-2.5 rounded-md border p-2">
      <ClerkLoaded>
        <UserButton />
      </ClerkLoaded>
      <ClerkLoading>
        <Loader2 className="size-7 shrink-0 animate-spin text-gray-600" />
      </ClerkLoading>

      <div className="min-w-0 flex-1">
        <ClerkLoaded>
          <p className="label-13 text-gray-1000 line-clamp-1 font-medium">
            {name}
          </p>
          {secondary && (
            <p className="copy-13 line-clamp-1 text-gray-800">{secondary}</p>
          )}
        </ClerkLoaded>
        <ClerkLoading>
          <Skeleton className="h-4 w-24" />
        </ClerkLoading>
      </div>

      <ThemeToggle />
    </div>
  );
};
