import { format } from "date-fns";

import { type ForecastEvent } from "@/features/forecast/components/forecast-events-card";
import {
  buildMonthGrid,
  isInMonth,
  orderedWeekdays,
  type CalendarMonth,
} from "@/lib/calendar";
import { DATE_FORMAT } from "@/lib/constants";
import { dateKeyUTC } from "@/lib/date-utc";
import { cn, formatCurrency } from "@/lib/utils";

const MAX_VISIBLE_EVENTS = 3;

type Props = {
  month: CalendarMonth;
  weekStartsOn: number;
  events: ForecastEvent[];
};

const groupByDay = (events: ForecastEvent[]) => {
  const grouped = new Map<string, ForecastEvent[]>();

  for (const event of events) {
    const key = dateKeyUTC(event.date);
    grouped.set(key, [...(grouped.get(key) ?? []), event]);
  }

  return grouped;
};

export const MonthGrid = ({ month, weekStartsOn, events }: Props) => {
  const eventsByDay = groupByDay(events);
  const todayKey = format(new Date(), DATE_FORMAT);

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[720px] grid-cols-7 overflow-hidden rounded-md border">
        {orderedWeekdays(weekStartsOn).map((weekday) => (
          <div
            key={weekday}
            className="label-12 border-b bg-gray-100 px-2 py-2 font-medium text-gray-900"
          >
            {weekday}
          </div>
        ))}
        {buildMonthGrid(month, weekStartsOn)
          .flat()
          .map((day) => {
            const key = dateKeyUTC(day);
            const dayEvents = eventsByDay.get(key) ?? [];
            const hidden = dayEvents.length - MAX_VISIBLE_EVENTS;

            return (
              <div
                key={key}
                className={cn(
                  "flex min-h-28 flex-col gap-y-1 border-r border-b p-1.5 [&:nth-child(7n)]:border-r-0",
                  !isInMonth(day, month) && "bg-gray-100/60"
                )}
              >
                <span
                  className={cn(
                    "label-12 flex size-6 items-center justify-center rounded-full",
                    isInMonth(day, month) ? "text-gray-1000" : "text-gray-700",
                    key === todayKey &&
                      "bg-primary text-primary-foreground font-semibold"
                  )}
                >
                  {day.getUTCDate()}
                </span>
                {dayEvents.slice(0, MAX_VISIBLE_EVENTS).map((event) => (
                  <div
                    key={event.id}
                    title={`${event.payee} · ${formatCurrency(event.amount)}`}
                    className={cn(
                      "label-12 flex items-center justify-between gap-x-1 rounded-sm px-1.5 py-0.5",
                      event.amount >= 0
                        ? "bg-green-100 text-green-900"
                        : "bg-red-100 text-red-900"
                    )}
                  >
                    <span className="truncate">{event.payee}</span>
                    <span className="numeric shrink-0">
                      {formatCurrency(Math.abs(event.amount))}
                    </span>
                  </div>
                ))}
                {hidden > 0 && (
                  <span className="label-12 px-1.5 text-gray-800">
                    +{hidden} more
                  </span>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};
