import { convertAmountFromMiliunits } from "@/lib/utils";

const fromMiliunits = (value: number | null) =>
  value === null ? null : convertAmountFromMiliunits(value);

type DebtAmounts = {
  principal: number;
  minimumPayment: number;
  paid: number;
  balance: number;
  projectedInterest: number | null;
  requiredPayment: number | null;
};

export const normalizeDebt = <T extends DebtAmounts>(debt: T) => ({
  ...debt,
  principal: convertAmountFromMiliunits(debt.principal),
  minimumPayment: convertAmountFromMiliunits(debt.minimumPayment),
  paid: convertAmountFromMiliunits(debt.paid),
  balance: convertAmountFromMiliunits(debt.balance),
  projectedInterest: fromMiliunits(debt.projectedInterest),
  requiredPayment: fromMiliunits(debt.requiredPayment),
});
