import { format } from "date-fns";
import { SheetFormLoading } from "@/components/sheet-form-loading";
import { Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useGetAccounts } from "@/features/accounts/api/use-get-accounts";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAddPayment } from "@/features/debts/api/use-add-payment";
import { useDeletePayment } from "@/features/debts/api/use-delete-payment";
import { useGetDebt } from "@/features/debts/api/use-get-debt";
import {
  PaymentForm,
  type PaymentApiValues,
} from "@/features/debts/components/payment-form";
import { usePayDebt } from "@/features/debts/hooks/use-pay-debt";
import { DISPLAY_DATE_FORMAT } from "@/lib/constants";
import { cn, formatCurrency } from "@/lib/utils";

export const PayDebtSheet = () => {
  const { isOpen, onClose, id } = usePayDebt();

  const accountsQuery = useGetAccounts();
  const accountOptions = (accountsQuery.data ?? []).map((account) => ({
    label: account.name,
    value: account.id,
  }));

  const debtQuery = useGetDebt(id);
  const addMutation = useAddPayment(id);
  const deleteMutation = useDeletePayment(id);

  const isPending = addMutation.isPending || deleteMutation.isPending;
  const debt = debtQuery.data;
  const payments = debt?.payments ?? [];

  const onSubmit = (values: PaymentApiValues) => {
    addMutation.mutate(values);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{debt?.name ?? "Log Payment"}</SheetTitle>
          <SheetDescription>
            {debt
              ? `${formatCurrency(debt.balance)} still owed of ${formatCurrency(
                  debt.principal
                )}.`
              : "Record a payment against this debt."}
          </SheetDescription>
        </SheetHeader>
        {debtQuery.isLoading || accountsQuery.isLoading ? (
          <SheetFormLoading />
        ) : (
          <div className="space-y-4">
            <PaymentForm
              onSubmit={onSubmit}
              disabled={isPending}
              isSubmitting={addMutation.isPending}
              accountOptions={accountOptions}
              defaultAccountId={debt?.accountId}
            />
            <Separator />
            <div className="space-y-2">
              <p className="label-14 text-gray-1000">History</p>
              {payments.length === 0 ? (
                <p className="copy-13 text-gray-900">
                  Nothing recorded yet. Entries you add show up here.
                </p>
              ) : (
                <ul className="divide-border divide-y">
                  {payments.map((payment) => (
                    <li
                      key={payment.id}
                      className="flex items-start justify-between gap-x-3 py-2"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <p
                          className={cn(
                            "numeric text-sm font-medium",
                            payment.amount < 0
                              ? "text-red-900"
                              : "text-green-900"
                          )}
                        >
                          {payment.amount < 0 ? "−" : "+"}
                          {formatCurrency(Math.abs(payment.amount))}
                        </p>
                        <p className="copy-13 text-gray-900">
                          {format(new Date(payment.date), DISPLAY_DATE_FORMAT)}
                        </p>
                        {payment.notes && (
                          <p className="copy-13 text-gray-900">
                            {payment.notes}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={isPending}
                        aria-label="Delete entry"
                        onClick={() => deleteMutation.mutate(payment.id)}
                      >
                        <Trash className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
