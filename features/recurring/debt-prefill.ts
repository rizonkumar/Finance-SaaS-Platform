import { scheduleDefaultsForDebt, type SchedulableDebt } from "@/lib/debts";

export type RecurringPrefill = {
  payee: string;
  amount: string;
  accountId: string;
  debtId: string;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval: string;
  endDate: Date | null;
};

export type PrefillableDebt = SchedulableDebt & {
  id: string;
  accountId: string | null;
};

export const debtSchedulePrefill = (
  debt: PrefillableDebt
): RecurringPrefill => {
  const defaults = scheduleDefaultsForDebt(debt);

  return {
    payee: defaults.payee,
    amount: String(defaults.amount),
    accountId: debt.accountId ?? "",
    debtId: debt.id,
    frequency: defaults.frequency,
    interval: String(defaults.interval),
    endDate: defaults.endDate,
  };
};

export type DebtOption = {
  label: string;
  value: string;
  prefill: RecurringPrefill;
};
