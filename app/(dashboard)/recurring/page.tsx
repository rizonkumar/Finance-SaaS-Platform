"use client";

import { Plus, Repeat } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { TablePageSkeleton } from "@/components/table-page-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBulkDeleteRecurring } from "@/features/recurring/api/use-bulk-delete-recurring";
import { useGetRecurringList } from "@/features/recurring/api/use-get-recurring-list";
import { useNewRecurring } from "@/features/recurring/hooks/use-new-recurring";

import { columns, type RecurringRow } from "./columns";

const RecurringPage = () => {
  const newRecurring = useNewRecurring();
  const recurringQuery = useGetRecurringList();
  const deleteRecurring = useBulkDeleteRecurring();

  if (recurringQuery.isLoading) {
    return <TablePageSkeleton />;
  }

  const rows = (recurringQuery.data ?? []).map((item) => ({
    id: item.id,
    payee: item.payee,
    amount: item.amount,
    account: item.account,
    category: item.category,
    frequency: item.frequency,
    interval: item.interval,
    isActive: item.isActive,
    nextOccurrence: item.nextOccurrence,
    generatedCount: item.generatedCount,
  })) satisfies RecurringRow[];

  const renderBody = () => {
    if (recurringQuery.isError) {
      return <ErrorState onRetry={() => recurringQuery.refetch()} />;
    }

    if (rows.length === 0) {
      return (
        <EmptyState
          icon={Repeat}
          title="No recurring transactions yet"
          description="Schedule rent, salary or a subscription once and it is entered for you from then on."
          actionLabel="Add Schedule"
          onAction={newRecurring.onOpen}
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
    <Card>
      <CardHeader className="gap-y-2 lg:flex-row lg:items-center lg:justify-between">
        <CardTitle>Recurring Transactions</CardTitle>
        <Button
          size="sm"
          onClick={newRecurring.onOpen}
          className="w-full lg:w-auto"
        >
          <Plus className="size-4" />
          Add Schedule
        </Button>
      </CardHeader>
      <CardContent>{renderBody()}</CardContent>
    </Card>
  );
};

export default RecurringPage;
