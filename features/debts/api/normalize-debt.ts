import { convertAmountFromMiliunits } from "@/lib/utils";

const fromMiliunits = (value: number | null) =>
  value === null ? null : convertAmountFromMiliunits(value);

type DebtSchedule = { amount: number };

type DebtAmounts = {
  principal: number;
  minimumPayment: number;
  paid: number;
  balance: number;
  projectedInterest: number | null;
  requiredPayment: number | null;
  schedule: DebtSchedule | null;
};

export const normalizeDebt = <T extends DebtAmounts>(debt: T) => ({
  ...debt,
  principal: convertAmountFromMiliunits(debt.principal),
  minimumPayment: convertAmountFromMiliunits(debt.minimumPayment),
  paid: convertAmountFromMiliunits(debt.paid),
  balance: convertAmountFromMiliunits(debt.balance),
  projectedInterest: fromMiliunits(debt.projectedInterest),
  requiredPayment: fromMiliunits(debt.requiredPayment),
  schedule: debt.schedule
    ? {
        ...debt.schedule,
        amount: convertAmountFromMiliunits(debt.schedule.amount),
      }
    : null,
});
