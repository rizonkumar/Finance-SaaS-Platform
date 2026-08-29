"use client";

import Link from "next/link";
import { PanelLeftClose } from "lucide-react";

import { AppLogo } from "@/components/app-logo";
import { BrandMark } from "@/components/brand-mark";
import { NavLinks } from "@/components/nav-links";
import { SidebarUserCard } from "@/components/sidebar-user-card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar, useSidebarInit } from "@/hooks/use-sidebar";
import { cn } from "@/lib/utils";

export const AppSidebar = () => {
  const { isCollapsed, toggleCollapsed } = useSidebar();
  useSidebarInit();

  return (
    <aside
      className={cn(
        "border-alpha-300 bg-surface hidden h-full shrink-0 flex-col border-r transition-[width] duration-200 ease-in-out lg:flex",
        isCollapsed ? "w-[68px]" : "w-60"
      )}
    >
      <div
        className={cn(
          "border-alpha-200 flex h-14 items-center border-b px-3",
          isCollapsed ? "justify-center" : "justify-between"
        )}
      >
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/"
                className="hover:bg-alpha-100 flex size-9 items-center justify-center rounded-md transition-colors"
                aria-label="Fintrack home"
              >
                <BrandMark className="size-5 shrink-0 text-blue-700" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>
              Fintrack Home
            </TooltipContent>
          </Tooltip>
        ) : (
          <>
            <AppLogo />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleCollapsed}
                  className="hover:text-gray-1000 size-8 shrink-0 rounded-md text-gray-700"
                  aria-label="Collapse sidebar"
                >
                  <PanelLeftClose className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10}>
                Collapse sidebar{" "}
                <kbd className="ml-1 text-xs opacity-70">⌘B</kbd>
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>

      <div className="flex-1 overflow-x-hidden overflow-y-auto px-2.5 py-3">
        <NavLinks isCollapsed={isCollapsed} />
      </div>

      <div
        className={cn(
          "border-alpha-200 border-t p-2.5",
          isCollapsed && "flex justify-center p-2"
        )}
      >
        <SidebarUserCard isCollapsed={isCollapsed} />
      </div>
    </aside>
  );
};
