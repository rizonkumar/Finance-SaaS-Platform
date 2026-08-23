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
import { useNewAccount } from "@/features/accounts/hooks/use-new-account";
import { useNewBudget } from "@/features/budgets/hooks/use-new-budget";
import { useNewCategory } from "@/features/categories/hooks/use-new-category";
import { useNewDebt } from "@/features/debts/hooks/use-new-debt";
import { useNewGoal } from "@/features/goals/hooks/use-new-goal";
import { useNewHolding } from "@/features/holdings/hooks/use-new-holding";
import { useNewRecurring } from "@/features/recurring/hooks/use-new-recurring";
import { useNewTransaction } from "@/features/transactions/hooks/use-new-transaction";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { useSidebar } from "@/hooks/use-sidebar";
import { pageMeta } from "@/lib/routes";

export const AppTopbar = () => {
  const pathname = usePathname();
  const { isCollapsed, toggleCollapsed } = useSidebar();
  const { onOpen: onOpenCommandPalette } = useCommandPalette();

  const newTransaction = useNewTransaction();
  const newAccount = useNewAccount();
  const newBudget = useNewBudget();
  const newCategory = useNewCategory();
  const newDebt = useNewDebt();
  const newGoal = useNewGoal();
  const newHolding = useNewHolding();
  const newRecurring = useNewRecurring();

  const title = pageMeta(pathname)?.title ?? "Fintrack";

  const getRouteAction = () => {
    switch (pathname) {
      case "/portfolio":
        return { label: "Add holding", run: newHolding.onOpen };
      case "/budgets":
        return { label: "Add budget", run: newBudget.onOpen };
      case "/goals":
        return { label: "Add goal", run: newGoal.onOpen };
      case "/debts":
        return { label: "Add debt", run: newDebt.onOpen };
      case "/recurring":
        return { label: "Add schedule", run: newRecurring.onOpen };
      case "/accounts":
        return { label: "Add account", run: newAccount.onOpen };
      case "/categories":
        return { label: "Add category", run: newCategory.onOpen };
      case "/forecast":
        return { label: "Add schedule", run: newRecurring.onOpen };
      case "/transactions":
      case "/":
      default:
        return { label: "New transaction", run: () => newTransaction.onOpen() };
    }
  };

  const currentAction = getRouteAction();

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

      {/* Right Section: Mobile Search, Dynamic Route Action & Profile */}
      <div className="flex items-center gap-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenCommandPalette}
          className="hover:text-gray-1000 size-8 rounded-md text-gray-700 sm:hidden"
          aria-label="Open search command palette"
        >
          <Search className="size-4" />
        </Button>

        {/* Dynamic Route Action Button */}
        <Button
          size="sm"
          onClick={currentAction.run}
          className="label-13 hidden h-8 items-center gap-x-1.5 px-3 shadow-xs md:inline-flex"
        >
          <Plus className="size-3.5" />
          <span>{currentAction.label}</span>
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
