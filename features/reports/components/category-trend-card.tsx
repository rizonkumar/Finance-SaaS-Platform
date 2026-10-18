import { FileSearch } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type ReportData } from "@/features/reports/api/use-get-reports";
import { formatMonthLabel } from "@/lib/reports";
import { cn, formatCurrency } from "@/lib/utils";

type Props = {
  months: string[];
  rows: ReportData["categories"];
};

const NUMERIC_CELL = "numeric text-right";

export const CategoryTrendCard = ({ months, rows }: Props) => (
  <Card>
    <CardHeader>
      <CardTitle>Spending by Category</CardTitle>
    </CardHeader>
    <CardContent>
      {rows.length === 0 ? (
        <EmptyState
          icon={FileSearch}
          title="No spending in this period"
          description="Spending shows up here, month by month, once you have expenses in the selected range."
        />
      ) : (
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>Category</TableHead>
                {months.map((month) => (
                  <TableHead key={month} className="text-right">
                    {formatMonthLabel(month)}
                  </TableHead>
                ))}
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.category}>
                  <TableCell className="font-medium">{row.category}</TableCell>
                  {row.values.map((value, index) => (
                    <TableCell
                      key={months[index]}
                      className={cn(
                        NUMERIC_CELL,
                        value === 0 && "text-gray-700"
                      )}
                    >
                      {value === 0 ? "—" : formatCurrency(value)}
                    </TableCell>
                  ))}
                  <TableCell className={cn(NUMERIC_CELL, "font-medium")}>
                    {formatCurrency(row.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </CardContent>
  </Card>
);
