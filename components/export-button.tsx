"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { csvFilename, toCsv, type CsvTable } from "@/lib/csv-export";

type Props = {
  name: string;
  getTable: () => CsvTable;
  disabled?: boolean;
  label?: string;
};

function downloadCsv(filename: string, table: CsvTable) {
  const blob = new Blob([toCsv(table)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export const ExportButton = ({
  name,
  getTable,
  disabled,
  label = "Export CSV",
}: Props) => (
  <Button
    size="sm"
    variant="outline"
    className="w-full lg:w-auto"
    disabled={disabled}
    onClick={() => downloadCsv(csvFilename(name), getTable())}
  >
    <Download className="size-4" />
    {label}
  </Button>
);
