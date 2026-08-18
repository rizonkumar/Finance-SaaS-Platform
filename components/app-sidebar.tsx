import { ClerkLoaded, ClerkLoading, UserButton } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

import { AppLogo } from "@/components/app-logo";
import { NavLinks } from "@/components/nav-links";
import { ThemeToggle } from "@/components/theme-toggle";

export const AppSidebar = () => {
  return (
    <aside className="border-alpha-300 bg-surface hidden h-full w-60 shrink-0 flex-col border-r lg:flex">
      <div className="flex h-14 items-center px-3">
        <AppLogo />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        <NavLinks />
      </div>

      <div className="border-alpha-300 flex items-center justify-between gap-x-2 border-t px-3 py-3">
        <ClerkLoaded>
          <UserButton />
        </ClerkLoaded>
        <ClerkLoading>
          <Loader2 className="size-7 animate-spin text-gray-600" />
        </ClerkLoading>
        <ThemeToggle />
      </div>
    </aside>
  );
};
