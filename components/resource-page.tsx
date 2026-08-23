"use client";

import type { ColumnDef, Row } from "@tanstack/react-table";

import { type tableFeatureSet } from "@/lib/table-features";
import { Plus, type LucideIcon } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader, type PageChip } from "@/components/page-header";
import { TablePageSkeleton } from "@/components/table-page-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ResourceRow = { id: string };

type Props<TData extends ResourceRow> = {
  title: string;
  description: string;
  chips?: PageChip[];
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
  description,
  chips,
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
    <>
      <PageHeader
        title={title}
        description={description}
        chips={chips}
        actions={
          <Button onClick={onCreate} size="sm">
            <Plus className="size-4" />
            {createLabel}
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-5">
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
    </>
  );
}
