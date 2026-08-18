"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useMountedState } from "react-use";

import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Monitor },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isMounted = useMountedState();

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className="border-alpha-300 bg-alpha-100 inline-flex items-center gap-0.5 rounded-full border p-0.5"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const isActive = isMounted() && theme === value;

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
