"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_SECTIONS } from "@/lib/routes";
import { cn } from "@/lib/utils";

type Props = {
  onNavigate?: () => void;
};

export const NavLinks = ({ onNavigate }: Props) => {
  const pathname = usePathname();

  return (
    <nav aria-label="Main">
      {NAV_SECTIONS.map((section, index) => (
        <div
          key={section.label ?? "primary"}
          className={cn(
            "flex flex-col gap-y-0.5",
            index === 1 && "border-alpha-200 mt-3 border-t pt-3"
          )}
        >
          {section.label && (
            <p className="label-12 px-2.5 pt-1 pb-1.5 font-medium text-gray-800">
              {section.label}
            </p>
          )}

          {section.items.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;

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
                {label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
};
