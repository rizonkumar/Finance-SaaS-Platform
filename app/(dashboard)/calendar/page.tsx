"use client";

import { Suspense } from "react";
import qs from "query-string";
import { CalendarClock, TrendingDown, TrendingUp } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AccountFilter } from "@/components/account-filter";
import { ChartCardLoading } from "@/components/chart-card";
import { ErrorState } from "@/components/error-state";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useGetCalendarEvents } from "@/features/calendar/api/use-get-calendar-events";
import { MonthGrid } from "@/features/calendar/components/month-grid";
import { MonthSwitcher } from "@/features/calendar/components/month-switcher";
import { ForecastEventsCard } from "@/features/forecast/components/forecast-events-card";
import { useGetSettings } from "@/features/settings/api/use-get-settings";
import { DEFAULT_WEEK_STARTS_ON } from "@/lib/budgets";
import {
  firstOfMonth,
  lastOfMonth,
  monthParam,
  parseMonthParam,
  shiftMonth,
} from "@/lib/calendar";
import { dateKeyUTC } from "@/lib/date-utc";
import { PAGE_META } from "@/lib/routes";
import { formatCurrency, pluralize } from "@/lib/utils";

const CalendarPage = () => (
  <Suspense fallback={<ChartCardLoading />}>
    <CalendarPageContent />
  </Suspense>
);

const CalendarPageContent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const settingsQuery = useGetSettings();

  const month = parseMonthParam(params.get("month"));
  const accountId = params.get("accountId") || "";
  const weekStartsOn =
    settingsQuery.data?.weekStartsOn ?? DEFAULT_WEEK_STARTS_ON;

  const eventsQuery = useGetCalendarEvents({
    from: dateKeyUTC(firstOfMonth(month)),
    to: dateKeyUTC(lastOfMonth(month)),
    accountId,
  });
  const events = eventsQuery.data ?? [];

  const moneyIn = events
    .filter((event) => event.amount >= 0)
    .reduce((total, event) => total + event.amount, 0);
  const bills = events.filter((event) => event.amount < 0);
  const moneyOut = bills.reduce(
    (total, event) => total + Math.abs(event.amount),
    0
  );

  const goToMonth = (value: string | null) =>
    router.push(
      qs.stringifyUrl(
        { url: pathname, query: { accountId, month: value } },
        { skipEmptyString: true, skipNull: true }
      )
    );

  const renderBody = () => {
    if (eventsQuery.isLoading) return <ChartCardLoading />;

    if (eventsQuery.isError) {
      return (
        <Card>
          <CardContent className="pt-5">
            <ErrorState onRetry={() => eventsQuery.refetch()} />
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        <Card>
          <CardHeader>
            <MonthSwitcher
              month={month}
              onShift={(delta) =>
                goToMonth(monthParam(shiftMonth(month, delta)))
              }
              onToday={() => goToMonth(null)}
            />
          </CardHeader>
          <CardContent>
            <MonthGrid
              month={month}
              weekStartsOn={weekStartsOn}
              events={events}
            />
          </CardContent>
        </Card>
        <ForecastEventsCard events={events} title="This Month" />
      </>
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={PAGE_META["/calendar"].title}
        description={PAGE_META["/calendar"].description}
        chips={
          events.length > 0
            ? [
                { label: pluralize(bills.length, "bill"), icon: CalendarClock },
                {
                  label: `${formatCurrency(moneyOut)} due`,
                  icon: TrendingDown,
                },
                {
                  label: `${formatCurrency(moneyIn)} coming in`,
                  icon: TrendingUp,
                },
              ]
            : undefined
        }
        filters={<AccountFilter />}
      />
      {renderBody()}
    </div>
  );
};

export default CalendarPage;
