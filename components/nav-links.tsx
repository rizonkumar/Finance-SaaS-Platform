"use client";

import { usePathname } from "next/navigation";

import { NavGroup, NavItem } from "@/components/nav-item";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SavedViewNav } from "@/features/views/components/saved-view-nav";
import { NAV_SECTIONS } from "@/lib/routes";

type Props = {
  isCollapsed?: boolean;
  onNavigate?: () => void;
};

export const NavLinks = ({ isCollapsed = false, onNavigate }: Props) => {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={150}>
      <nav aria-label="Main" className="space-y-3">
        {NAV_SECTIONS.map((section, index) => (
          <NavGroup
            key={section.label ?? "primary"}
            label={section.label}
            isCollapsed={isCollapsed}
            isFirst={index === 0}
          >
            {section.items.map(({ href, label, icon: Icon }) => (
              <NavItem
                key={href}
                href={href}
                label={label}
                icon={<Icon className="size-4 shrink-0" />}
                isActive={pathname === href}
                isCollapsed={isCollapsed}
                onClick={onNavigate}
              />
            ))}
          </NavGroup>
        ))}
        <SavedViewNav isCollapsed={isCollapsed} onNavigate={onNavigate} />
      </nav>
    </TooltipProvider>
  );
};
