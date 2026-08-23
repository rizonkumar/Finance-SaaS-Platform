"use client";

import { ClerkLoaded, ClerkLoading, UserButton } from "@clerk/nextjs";
import { Loader2, Search } from "lucide-react";
import { usePathname } from "next/navigation";

import { MobileNav } from "@/components/mobile-nav";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { pageMeta } from "@/lib/routes";

export const AppTopbar = () => {
  const pathname = usePathname();
  const palette = useCommandPalette();

  const title = pageMeta(pathname)?.title ?? "Fintrack";

  return (
    <header className="border-alpha-300 bg-canvas/70 z-30 flex min-h-14 shrink-0 items-center gap-x-3 border-b px-4 py-2.5 backdrop-blur-xl lg:px-6">
      <div className="lg:hidden">
        <MobileNav />
      </div>

      <h1 className="heading-16 text-gray-1000 mr-auto lg:hidden">{title}</h1>

      <button
        type="button"
        onClick={palette.onOpen}
        className="border-input bg-surface hover:border-alpha-500 label-14 hidden h-9 w-full max-w-md items-center gap-x-2.5 rounded-sm border px-3 text-gray-700 transition-colors lg:flex"
      >
        <Search className="size-4 shrink-0" />
        <span className="mr-auto">Search or jump to...</span>
        <kbd className="border-alpha-300 bg-alpha-100 rounded-sm border px-1.5 py-0.5 text-xs">
          ⌘K
        </kbd>
      </button>

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
