"use client";

import { ClerkLoaded, ClerkLoading, UserButton } from "@clerk/nextjs";
import { Loader2, PanelLeftOpen, Plus, Search } from "lucide-react";
import { usePathname } from "next/navigation";

import { CommandPalette } from "@/components/command-palette";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNewTransaction } from "@/features/transactions/hooks/use-new-transaction";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { useSidebar } from "@/hooks/use-sidebar";
import { pageMeta } from "@/lib/routes";

export const AppTopbar = () => {
  const pathname = usePathname();
  const { isCollapsed, toggleCollapsed } = useSidebar();
  const { onOpen: onOpenCommandPalette } = useCommandPalette();
  const newTransaction = useNewTransaction();

  const title = pageMeta(pathname)?.title ?? "Fintrack";

  return (
    <header className="border-alpha-300 bg-surface/70 z-30 flex min-h-14 shrink-0 items-center justify-between gap-x-3 border-b px-4 py-2.5 backdrop-blur-xl lg:px-6">
      {/* Left Section: Mobile Nav / (When Collapsed: Desktop Expand Toggle) + Title */}
      <div className="flex items-center gap-x-3">
        <div className="lg:hidden">
          <MobileNav />
        </div>

        {isCollapsed && (
          <div className="hidden items-center lg:flex">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleCollapsed}
                  className="hover:text-gray-1000 size-8 rounded-md text-gray-700"
                  aria-label="Expand sidebar"
                >
                  <PanelLeftOpen className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8}>
                Expand sidebar <kbd className="ml-1 text-xs opacity-70">⌘B</kbd>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        <div className="flex items-center gap-x-2">
          <span className="label-13 hidden text-gray-600 xl:inline">
            Dashboard
          </span>
          <span className="hidden text-gray-400 xl:inline">/</span>
          <h1 className="heading-16 text-gray-1000 truncate font-semibold">
            {title}
          </h1>
        </div>
      </div>

      {/* Center Section: Balanced Search / Command Palette */}
      <div className="mx-auto hidden max-w-sm flex-1 items-center justify-center px-2 sm:flex md:max-w-md">
        <CommandPalette />
      </div>

      {/* Right Section: Mobile Search, Quick Actions & Profile */}
      <div className="flex items-center gap-x-2">
        {/* Mobile Search Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenCommandPalette}
          className="hover:text-gray-1000 size-8 rounded-md text-gray-700 sm:hidden"
          aria-label="Open search command palette"
        >
          <Search className="size-4" />
        </Button>

        {/* Quick Create Button */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => newTransaction.onOpen()}
          className="label-13 border-alpha-300 hover:bg-alpha-100 hidden h-8 items-center gap-x-1.5 px-2.5 text-gray-900 shadow-xs md:inline-flex"
        >
          <Plus className="size-3.5" />
          <span>New transaction</span>
        </Button>

        {/* Mobile User Profile (also in drawer) */}
        <div className="flex items-center pl-1 lg:hidden">
          <ClerkLoaded>
            <UserButton />
          </ClerkLoaded>
          <ClerkLoading>
            <Loader2 className="size-6 animate-spin text-gray-600" />
          </ClerkLoading>
        </div>
      </div>
    </header>
  );
};
