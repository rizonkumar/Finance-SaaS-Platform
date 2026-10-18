import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { firstOfMonth, type CalendarMonth } from "@/lib/calendar";

type Props = {
  month: CalendarMonth;
  onShift: (delta: number) => void;
  onToday: () => void;
};

export const MonthSwitcher = ({ month, onShift, onToday }: Props) => (
  <div className="flex items-center gap-x-1">
    <Button
      size="icon-sm"
      variant="outline"
      onClick={() => onShift(-1)}
      aria-label="Previous month"
    >
      <ChevronLeft />
    </Button>
    <p className="heading-16 text-gray-1000 min-w-36 text-center">
      {format(firstOfMonth(month), "MMMM yyyy")}
    </p>
    <Button
      size="icon-sm"
      variant="outline"
      onClick={() => onShift(1)}
      aria-label="Next month"
    >
      <ChevronRight />
    </Button>
    <Button size="sm" variant="ghost" onClick={onToday}>
      Today
    </Button>
  </div>
);
