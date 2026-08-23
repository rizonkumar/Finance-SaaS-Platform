"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Monitor },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

type ThemeToggleProps = {
  compact?: boolean;
  className?: string;
};

export function ThemeToggle({ compact = false, className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const isMounted = useIsMounted();

  if (compact) {
    const currentOption =
      OPTIONS.find((opt) => opt.value === theme) ?? OPTIONS[1];
    const Icon = currentOption.icon;

    const cycleTheme = () => {
      const currentIndex = OPTIONS.findIndex((opt) => opt.value === theme);
      const nextIndex =
        currentIndex >= 0 ? (currentIndex + 1) % OPTIONS.length : 0;
      const targetOption = OPTIONS[nextIndex];
      if (targetOption) {
        setTheme(targetOption.value);
      }
    };

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`Theme: ${currentOption.label}. Click to cycle.`}
            onClick={cycleTheme}
            className={cn(
              "border-alpha-300 bg-alpha-100 hover:bg-alpha-200 hover:text-gray-1000 flex size-8 items-center justify-center rounded-md border text-gray-800 transition-colors",
              className
            )}
          >
            {isMounted ? (
              <Icon className="size-4" />
            ) : (
              <Sun className="size-4" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={10}>
          Theme: {currentOption.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn(
        "border-alpha-300 bg-alpha-100 inline-flex items-center gap-0.5 rounded-full border p-0.5",
        className
      )}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const isActive = isMounted && theme === value;

        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={label}
            onClick={() => setTheme(value)}
            className={cn(
              "flex size-7 items-center justify-center rounded-full transition-colors",
              isActive
                ? "bg-surface text-gray-1000 shadow-card"
                : "hover:text-gray-1000 text-gray-700"
            )}
          >
            <Icon className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}
