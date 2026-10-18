import { FileSearch } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { ProgressBar } from "@/components/progress-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ReportData } from "@/features/reports/api/use-get-reports";
import { formatCurrency, pluralize } from "@/lib/utils";

type Props = {
  payees: ReportData["payees"];
};

export const TopPayeesCard = ({ payees }: Props) => {
  const largest = payees[0]?.total ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Payees</CardTitle>
      </CardHeader>
      <CardContent>
        {payees.length === 0 ? (
          <EmptyState
            icon={FileSearch}
            title="No payees yet"
            description="The people and shops you spend the most with appear here."
          />
        ) : (
          <ul className="space-y-4">
            {payees.map((payee) => (
              <li key={payee.payee} className="space-y-1.5">
                <div className="flex items-center justify-between gap-x-4">
                  <div className="min-w-0">
                    <p className="copy-14 text-gray-1000 line-clamp-1 font-medium">
                      {payee.payee}
                    </p>
                    <p className="copy-13 text-gray-900">
                      {pluralize(payee.count, "transaction")}
                    </p>
                  </div>
                  <p className="numeric text-gray-1000 shrink-0 text-sm font-semibold">
                    {formatCurrency(payee.total)}
                  </p>
                </div>
                <ProgressBar
                  percentage={largest > 0 ? (payee.total / largest) * 100 : 0}
                  label={`${payee.payee} share of top spending`}
                  fillClassName="bg-chart-3"
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
