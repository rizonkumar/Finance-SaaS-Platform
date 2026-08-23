import { ACCOUNT_TYPES, type AccountType } from "@/lib/net-worth";

export const MILIUNITS_FACTOR = 1000;

export const DEFAULT_PERIOD_DAYS = 30;

export const MAX_TREND_DAYS = 400;

export const DATE_FORMAT = "yyyy-MM-dd";
export const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const DATE_TIME_FORMAT = "yyyy-MM-dd HH:mm:ss";
export const DISPLAY_DATE_FORMAT = "dd MMMM, yyyy";

export const TOP_CATEGORY_COUNT = 3;

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  savings: "Savings",
  cash: "Cash",
  wallet: "Wallet",
  investment: "Investment",
  fixed_deposit: "Fixed deposit",
  ppf: "PPF",
  epf: "EPF",
  credit: "Credit card",
  loan: "Loan",
};

export const ACCOUNT_TYPE_OPTIONS = ACCOUNT_TYPES.map((value) => ({
  value,
  label: ACCOUNT_TYPE_LABELS[value],
}));

export const CHART_HEIGHT = 350;

export const CHART_SERIES = {
  income: "var(--chart-2)",
  expenses: "var(--chart-3)",
} as const;

export const NET_WORTH_SERIES = {
  assets: "var(--chart-2)",
  liabilities: "var(--chart-3)",
  netWorth: "var(--chart-1)",
} as const;

export const CHART_CATEGORY_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
] as const;

export const CURRENCY_LOCALE = "en-IN";
export const CURRENCY_CODE = "INR";

export const CURRENCY_SYMBOL = "\u20B9";
