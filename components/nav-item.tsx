"use client";

import Link from "next/link";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const ACTIVE_ITEM = "bg-alpha-200 text-gray-1000 font-medium";
const IDLE_ITEM = "hover:bg-alpha-100 hover:text-gray-1000 text-gray-900";

type NavItemProps = {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
  isCollapsed: boolean;
  onClick?: () => void;
};

export const NavItem = ({
  href,
  label,
  icon,
  isActive = false,
  isCollapsed,
  onClick,
}: NavItemProps) => {
  const ariaCurrent = isActive ? "page" : undefined;

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={href}
            onClick={onClick}
            aria-label={label}
            aria-current={ariaCurrent}
            className={cn(
              "mx-auto flex size-10 items-center justify-center rounded-md transition-colors",
              isActive ? ACTIVE_ITEM : IDLE_ITEM
            )}
          >
            {icon}
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
      href={href}
      onClick={onClick}
      aria-current={ariaCurrent}
      className={cn(
        "label-14 flex items-center gap-x-2.5 rounded-sm px-2.5 py-2 transition-colors",
        isActive ? ACTIVE_ITEM : IDLE_ITEM
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
    </Link>
  );
};

type NavGroupProps = {
  label: string | null;
  isCollapsed: boolean;
  isFirst?: boolean;
  children: React.ReactNode;
};

export const NavGroup = ({
  label,
  isCollapsed,
  isFirst = false,
  children,
}: NavGroupProps) => (
  <div
    className={cn(
      "flex flex-col gap-y-0.5",
      !isFirst && "border-alpha-200 border-t pt-2.5"
    )}
  >
    {label && !isCollapsed && (
      <p className="label-12 px-2.5 pt-0.5 pb-1 font-medium text-gray-800 transition-opacity">
        {label}
      </p>
    )}
    {children}
  </div>
);
