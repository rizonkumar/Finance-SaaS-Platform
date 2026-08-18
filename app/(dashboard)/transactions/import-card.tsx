import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  assignColumn,
  countMappedColumns,
  mapImportedRows,
  REQUIRED_IMPORT_COLUMNS,
  type ImportedTransaction,
  type SelectedColumns,
} from "@/lib/csv-import";

import { ImportTable } from "./import-table";

type Props = {
  data: string[][];
  onCancel: () => void;
  onSubmit: (data: ImportedTransaction[]) => void;
};

export const ImportCard = ({ data, onCancel, onSubmit }: Props) => {
  const [selectedColumns, setSelectedColumns] = useState<SelectedColumns>({});

  const [headers = [], ...body] = data;

  const onTableHeadSelectChange = (
    columnIndex: number,
    value: string | null
  ) => {
    setSelectedColumns((prev) => assignColumn(prev, columnIndex, value));
  };

  const progress = countMappedColumns(selectedColumns);

  const handleContinue = () => {
    onSubmit(mapImportedRows(headers, body, selectedColumns));
  };

  return (
    <Card>
      <CardHeader className="gap-y-2 lg:flex-row lg:items-center lg:justify-between">
        <CardTitle>Import Transactions</CardTitle>
        <div className="flex flex-col items-center gap-x-2 gap-y-2 lg:flex-row">
          <Button
            onClick={onCancel}
            size="sm"
            variant="outline"
            className="w-full lg:w-auto"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={progress < REQUIRED_IMPORT_COLUMNS.length}
            onClick={handleContinue}
            className="w-full lg:w-auto"
          >
            Continue ({progress} / {REQUIRED_IMPORT_COLUMNS.length})
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ImportTable
          headers={headers}
          body={body}
          selectedColumns={selectedColumns}
          onTableHeadSelectChange={onTableHeadSelectChange}
        />
      </CardContent>
    </Card>
  );
};
