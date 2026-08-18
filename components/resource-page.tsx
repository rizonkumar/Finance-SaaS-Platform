"use client";

import type { ColumnDef, Row } from "@tanstack/react-table";

import { type tableFeatureSet } from "@/lib/table-features";
import { Plus, type LucideIcon } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { TablePageSkeleton } from "@/components/table-page-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ResourceRow = { id: string };

type Props<TData extends ResourceRow> = {
  title: string;
  createLabel: string;
  filterKey: string;
  columns: ColumnDef<typeof tableFeatureSet, TData, unknown>[];
  data: TData[];
  isLoading: boolean;
  disabled: boolean;
  onCreate: () => void;
  onDelete: (ids: string[]) => void;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
};

export function ResourcePage<TData extends ResourceRow>({
  title,
  createLabel,
  filterKey,
  columns,
  data,
  isLoading,
  disabled,
  onCreate,
  onDelete,
  emptyIcon,
  emptyTitle,
  emptyDescription,
}: Props<TData>) {
  if (isLoading) {
    return <TablePageSkeleton />;
  }

  return (
    <Card>
      <CardHeader className="gap-y-2 lg:flex-row lg:items-center lg:justify-between">
        <CardTitle>{title}</CardTitle>
        <Button onClick={onCreate} size="sm" className="w-full lg:w-auto">
          <Plus className="size-4" />
          {createLabel}
        </Button>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
            actionLabel={createLabel}
            onAction={onCreate}
          />
        ) : (
          <DataTable
            filterKey={filterKey}
            columns={columns}
            data={data}
            onDelete={(rows: Row<typeof tableFeatureSet, TData>[]) =>
              onDelete(rows.map((row) => row.original.id))
            }
            disabled={disabled}
          />
        )}
      </CardContent>
    </Card>
  );
}
