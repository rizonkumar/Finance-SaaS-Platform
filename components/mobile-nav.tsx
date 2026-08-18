"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import { AppLogo } from "@/components/app-logo";
import { NavLinks } from "@/components/nav-links";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open navigation">
          <Menu className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="flex h-14 items-center px-3">
          <AppLogo />
        </div>
        <div className="px-3 py-2">
          <NavLinks onNavigate={() => setIsOpen(false)} />
        </div>
        <div className="border-alpha-300 mt-2 border-t px-3 py-3">
          <ThemeToggle />
        </div>
      </SheetContent>
    </Sheet>
  );
};
