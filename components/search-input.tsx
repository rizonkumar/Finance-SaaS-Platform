import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export const SearchInput = ({
  value,
  onChange,
  placeholder,
  className,
}: Props) => (
  <div className={cn("relative w-full sm:w-64", className)}>
    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-700" />
    <Input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-9 pl-9"
    />
  </div>
);
