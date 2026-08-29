"use client";

import { ClerkLoaded, ClerkLoading, UserButton, useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Props = {
  isCollapsed?: boolean;
  className?: string;
};

export const SidebarUserCard = ({ isCollapsed = false, className }: Props) => {
  const { user } = useUser();

  const name = user?.fullName ?? user?.username ?? "Your account";
  const secondary = user?.primaryEmailAddress?.emailAddress;

  if (isCollapsed) {
    return (
      <div
        className={cn("flex flex-col items-center gap-y-2.5 py-1", className)}
      >
        <div className="flex size-9 items-center justify-center">
          <ClerkLoaded>
            <UserButton />
          </ClerkLoaded>
          <ClerkLoading>
            <Loader2 className="size-6 animate-spin text-gray-600" />
          </ClerkLoading>
        </div>
        <ThemeToggle compact />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border-alpha-300 bg-alpha-100 flex items-center gap-x-2.5 rounded-md border p-2",
        className
      )}
    >
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
