"use client";

import { format } from "date-fns";
import { CalendarClock, FileSearch } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DISPLAY_DATE_FORMAT } from "@/lib/constants";
import { dateKeyUTC } from "@/lib/date-utc";
import { cn, formatCurrency } from "@/lib/utils";

export type ForecastEvent = {
  id: string;
  account: string | null;
  category: string | null;
  payee: string;
  amount: number;
  date: Date;
};

type Props = {
  events: ForecastEvent[];
};

const groupedEvents = (events: ForecastEvent[]) => {
  const groups = new Map<string, ForecastEvent[]>();

  for (const event of events) {
    const key = dateKeyUTC(event.date);
    const bucket = groups.get(key);

    if (bucket) {
      bucket.push(event);
    } else {
      groups.set(key, [event]);
    }
  }

  return [...groups.entries()].map(([date, rows]) => ({ date, rows }));
};

export const ForecastEventsCard = ({ events }: Props) => {
  const groups = groupedEvents(events);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Events</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <EmptyState
            icon={FileSearch}
            title="No recurring events in this window"
            description="Add recurring income or expenses to see how your balances may move over time."
          />
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <section key={group.date} className="space-y-2">
                <p className="label-13 text-gray-900">
                  {format(
                    group.rows[0]?.date ?? group.date,
                    DISPLAY_DATE_FORMAT
                  )}
                </p>
                <ul className="divide-border divide-y">
                  {group.rows.map((event) => {
                    const isIncome = event.amount >= 0;

                    return (
                      <li
                        key={event.id}
                        className="flex items-center justify-between gap-x-4 py-3"
                      >
                        <div className="flex min-w-0 items-center gap-x-3">
                          <div className="bg-alpha-100 flex size-9 shrink-0 items-center justify-center rounded-sm text-gray-900">
                            <CalendarClock className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="copy-14 text-gray-1000 line-clamp-1 font-medium">
                              {event.payee}
                            </p>
                            <p className="copy-13 line-clamp-1 text-gray-900">
                              {event.account ?? "Unlinked"}
                              {event.category ? ` · ${event.category}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-y-1">
                          <p
                            className={cn(
                              "numeric text-sm font-semibold",
                              isIncome ? "text-green-900" : "text-red-900"
                            )}
                          >
                            {formatCurrency(event.amount)}
                          </p>
                          <Badge variant={isIncome ? "income" : "expense"}>
                            {isIncome ? "Income" : "Expense"}
                          </Badge>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
