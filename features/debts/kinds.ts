export type DebtKind = "loan" | "credit-card" | "other";

export const DEBT_KIND_LABELS: Record<DebtKind, string> = {
  loan: "Loan",
  "credit-card": "Credit card",
  other: "Other",
};

export const DEBT_KIND_OPTIONS: { label: string; value: DebtKind }[] = [
  { label: DEBT_KIND_LABELS.loan, value: "loan" },
  { label: DEBT_KIND_LABELS["credit-card"], value: "credit-card" },
  { label: DEBT_KIND_LABELS.other, value: "other" },
];
