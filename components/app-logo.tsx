import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { cn } from "@/lib/utils";

type Props = {
  isCollapsed?: boolean;
  className?: string;
};

export const AppLogo = ({ isCollapsed, className }: Props) => {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-x-2.5 rounded-sm px-2 py-1 transition-all duration-200",
        isCollapsed && "w-full justify-center px-0",
        className
      )}
      aria-label="Fintrack home"
    >
      <BrandMark className="size-5 shrink-0 text-blue-700" />
      {!isCollapsed && (
        <span className="heading-16 text-gray-1000 overflow-hidden whitespace-nowrap transition-opacity duration-200">
          Fintrack
        </span>
      )}
    </Link>
  );
};
