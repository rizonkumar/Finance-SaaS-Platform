"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

import { AppLogo } from "@/components/app-logo";
import { NavLinks } from "@/components/nav-links";
import { SidebarUserCard } from "@/components/sidebar-user-card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open navigation"
          className="hover:text-gray-1000 size-9 text-gray-800"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        hideClose
        className="bg-surface shadow-modal border-alpha-300 flex h-full w-[280px] max-w-[85vw] flex-col border-r p-0 sm:w-[320px]"
      >
        <SheetTitle className="sr-only">Navigation menu</SheetTitle>

        {/* Header */}
        <div className="border-alpha-200 flex h-14 shrink-0 items-center justify-between border-b px-4">
          <AppLogo />
          <SheetClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="hover:text-gray-1000 size-8 rounded-md text-gray-700"
              aria-label="Close navigation"
            >
              <X className="size-4" />
            </Button>
          </SheetClose>
        </div>

        {/* Scrollable Nav Links */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <NavLinks onNavigate={() => setIsOpen(false)} />
        </div>

        {/* Bottom Pinned User Profile & Theme Toggle */}
        <div className="border-alpha-200 bg-surface/60 mt-auto border-t p-3">
          <SidebarUserCard />
        </div>
      </SheetContent>
    </Sheet>
  );
};
