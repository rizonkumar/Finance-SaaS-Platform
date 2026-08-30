"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, SearchX, Trash } from "lucide-react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type RowData,
  type SortingState,
  flexRender,
  useTable,
} from "@tanstack/react-table";

import { EmptyState } from "@/components/empty-state";
import { SearchInput } from "@/components/search-input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useConfirm } from "@/hooks/use-confirm";
import { Button } from "@/components/ui/button";
import { tableFeatureSet } from "@/lib/table-features";

interface DataTableProps<TData extends RowData, TValue> {
  columns: ColumnDef<typeof tableFeatureSet, TData, TValue>[];
  data: TData[];
  filterKey: string;
  onDelete: (rows: Row<typeof tableFeatureSet, TData>[]) => void;
  disabled?: boolean;
}

export function DataTable<TData extends RowData, TValue>({
  columns,
  data,
  filterKey,
  onDelete,
  disabled,
}: DataTableProps<TData, TValue>) {
  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    "You are about to perform a bulk delete."
  );

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useTable({
    features: tableFeatureSet,
    data,
    columns: columns as ColumnDef<typeof tableFeatureSet, TData, unknown>[],
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      pagination,
    },
  });

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div>
      <ConfirmDialog />
      <div className="flex flex-col-reverse gap-2 pb-4 sm:flex-row sm:items-center sm:justify-end">
        <div className="min-h-9 sm:mr-auto">
          {selectedCount > 0 && (
            <Button
              disabled={disabled}
              size="sm"
              variant="outline"
              onClick={async () => {
                const ok = await confirm();

                if (ok) {
                  onDelete(table.getFilteredSelectedRowModel().rows);
                  table.resetRowSelection();
                }
              }}
            >
              <Trash className="size-4" />
              Delete ({selectedCount})
            </Button>
          )}
        </div>
        <SearchInput
          placeholder={`Search ${filterKey}...`}
          value={(table.getColumn(filterKey)?.getFilterValue() as string) ?? ""}
          onChange={(value) =>
            table.getColumn(filterKey)?.setFilterValue(value)
          }
        />
      </div>
      <div>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <EmptyState
                    icon={SearchX}
                    title="No results"
                    description="No rows matched your search. Try a different term."
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-4">
        <p className="copy-13 mr-auto text-gray-900">
          {selectedCount > 0
            ? `${selectedCount} of ${table.getFilteredRowModel().rows.length} selected`
            : `${table.getFilteredRowModel().rows.length} rows`}
        </p>
        <p className="copy-13 numeric text-gray-900">
          Page {pagination.pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
        </p>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Previous page"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Next page"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
