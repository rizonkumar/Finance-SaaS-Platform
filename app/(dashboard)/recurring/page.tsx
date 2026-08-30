"use client";

import { Repeat } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { TablePageSkeleton } from "@/components/table-page-skeleton";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { PAGE_META } from "@/lib/routes";
import { useBulkDeleteRecurring } from "@/features/recurring/api/use-bulk-delete-recurring";
import { useGetRecurringList } from "@/features/recurring/api/use-get-recurring-list";
import { useNewRecurring } from "@/features/recurring/hooks/use-new-recurring";

import { columns, type RecurringRow } from "./columns";

const RecurringPage = () => {
  const newRecurring = useNewRecurring();
  const recurringQuery = useGetRecurringList();
  const deleteRecurring = useBulkDeleteRecurring();

  const rows = (recurringQuery.data ?? []).map((item) => ({
    id: item.id,
    payee: item.payee,
    amount: item.amount,
    account: item.account,
    toAccount: item.toAccount,
    category: item.category,
    debt: item.debt,
    frequency: item.frequency,
    interval: item.interval,
    isActive: item.isActive,
    nextOccurrence: item.nextOccurrence,
    generatedCount: item.generatedCount,
  })) satisfies RecurringRow[];

  const renderBody = () => {
    if (recurringQuery.isLoading) return <TablePageSkeleton />;

    if (recurringQuery.isError) {
      return <ErrorState onRetry={() => recurringQuery.refetch()} />;
    }

    if (rows.length === 0) {
      return (
        <EmptyState
          icon={Repeat}
          title="No recurring transactions yet"
          description="Schedule rent, salary or a subscription once and it is entered for you from then on."
          actionLabel="Add schedule"
          onAction={() => newRecurring.onOpen()}
        />
      );
    }

    return (
      <DataTable
        filterKey="payee"
        columns={columns}
        data={rows}
        onDelete={(selected) =>
          deleteRecurring.mutate({
            ids: selected.map((row) => row.original.id),
          })
        }
        disabled={deleteRecurring.isPending}
      />
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={PAGE_META["/recurring"].title}
        description={PAGE_META["/recurring"].description}
        chips={
          rows.length > 0
            ? [
                {
                  label: `${rows.length} ${rows.length === 1 ? "schedule" : "schedules"}`,
                  icon: Repeat,
                },
              ]
            : undefined
        }
      />
      <Card>
        <CardContent className="pt-5">{renderBody()}</CardContent>
      </Card>
    </div>
  );
};

export default RecurringPage;
