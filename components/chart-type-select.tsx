import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type ChartTypeOption = {
  value: string;
  label: string;
  icon: LucideIcon;
};

type Props = {
  value: string;
  options: readonly ChartTypeOption[];
  onChange: (value: string) => void;
};

export const ChartTypeSelect = ({ value, options, onChange }: Props) => {
  return (
    <div
      role="radiogroup"
      aria-label="Chart type"
      className="border-alpha-300 bg-alpha-100 inline-flex shrink-0 items-center gap-0.5 rounded-full border p-0.5"
    >
      {options.map(({ value: optionValue, label, icon: Icon }) => {
        const isActive = value === optionValue;

        return (
          <button
            key={optionValue}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={label}
            title={label}
            onClick={() => onChange(optionValue)}
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
};
