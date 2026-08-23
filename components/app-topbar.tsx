"use client";

import { ClerkLoaded, ClerkLoading, UserButton } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";

import { CommandPalette } from "@/components/command-palette";
import { MobileNav } from "@/components/mobile-nav";
import { pageMeta } from "@/lib/routes";

export const AppTopbar = () => {
  const pathname = usePathname();

  const title = pageMeta(pathname)?.title ?? "Fintrack";

  return (
    <header className="border-alpha-300 bg-canvas/70 z-30 flex min-h-14 shrink-0 items-center gap-x-3 border-b px-4 py-2.5 backdrop-blur-xl lg:px-6">
      <div className="lg:hidden">
        <MobileNav />
      </div>

      <h1 className="heading-16 text-gray-1000 mr-auto lg:hidden">{title}</h1>

      <CommandPalette />

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
