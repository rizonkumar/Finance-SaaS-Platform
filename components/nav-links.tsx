"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NAV_SECTIONS } from "@/lib/routes";
import { cn } from "@/lib/utils";

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
          <div
            key={section.label ?? "primary"}
            className={cn(
              "flex flex-col gap-y-0.5",
              index > 0 && "border-alpha-200 border-t pt-2.5"
            )}
          >
            {section.label && !isCollapsed && (
              <p className="label-12 px-2.5 pt-0.5 pb-1 font-medium text-gray-800 transition-opacity">
                {section.label}
              </p>
            )}

            {section.items.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;

              if (isCollapsed) {
                return (
                  <Tooltip key={href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={href}
                        onClick={onNavigate}
                        aria-label={label}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "mx-auto flex size-10 items-center justify-center rounded-md transition-colors",
                          isActive
                            ? "bg-alpha-200 text-gray-1000 font-medium"
                            : "hover:bg-alpha-100 hover:text-gray-1000 text-gray-900"
                        )}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="sr-only">{label}</span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={12}>
                      {label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "label-14 flex items-center gap-x-2.5 rounded-sm px-2.5 py-2 transition-colors",
                    isActive
                      ? "bg-alpha-200 text-gray-1000 font-medium"
                      : "hover:bg-alpha-100 hover:text-gray-1000 text-gray-900"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </TooltipProvider>
  );
};
