import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const BASE =
  "flex flex-1 items-center justify-center gap-x-1.5 rounded-sm border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-700";
const IDLE = "border-input text-gray-900 hover:bg-alpha-100";
const POSITIVE = "border-green-500 bg-green-100 text-green-900";
const NEGATIVE = "border-red-500 bg-red-100 text-red-900";

type Choice<T extends string> = {
  value: T;
  label: string;
  icon: LucideIcon;
};

type Props<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  positive: Choice<T>;
  negative: Choice<T>;
  disabled?: boolean;
};

export function DirectionToggle<T extends string>({
  value,
  onChange,
  positive,
  negative,
  disabled,
}: Props<T>) {
  return (
    <div className="flex gap-x-2">
      {[positive, negative].map((choice) => {
        const Icon = choice.icon;
        const isActive = value === choice.value;
        const activeTone = choice === positive ? POSITIVE : NEGATIVE;

        return (
          <button
            key={choice.value}
            type="button"
            disabled={disabled}
            aria-pressed={isActive}
            onClick={() => onChange(choice.value)}
            className={cn(BASE, isActive ? activeTone : IDLE)}
          >
            <Icon className="size-4" />
            {choice.label}
          </button>
        );
      })}
    </div>
  );
}
