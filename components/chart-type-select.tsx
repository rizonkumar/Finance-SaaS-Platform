import type { LucideIcon } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className="h-8 w-auto px-2.5 text-xs"
        aria-label="Chart type"
      >
        <SelectValue placeholder="Chart type" />
      </SelectTrigger>
      <SelectContent>
        {options.map(({ value: optionValue, label, icon: Icon }) => (
          <SelectItem key={optionValue} value={optionValue}>
            <span className="flex items-center gap-x-2">
              <Icon className="size-3.5 text-gray-800" />
              {label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
