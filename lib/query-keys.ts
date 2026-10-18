export const queryKeys = {
  summary: () => ["summary"] as const,
  netWorth: () => ["net-worth"] as const,
  forecast: () => ["forecast"] as const,
  forecastEvents: () => ["forecast", "events"] as const,
  reports: () => ["reports"] as const,

  accounts: () => ["accounts"] as const,
  account: (id?: string) => ["account", { id }] as const,

  categories: () => ["categories"] as const,
  category: (id?: string) => ["category", { id }] as const,

  transactions: () => ["transactions"] as const,
  transaction: (id?: string) => ["transaction", { id }] as const,

  budgets: () => ["budgets"] as const,
  budget: (id?: string) => ["budget", { id }] as const,

  recurring: () => ["recurring"] as const,
  recurringItem: (id?: string) => ["recurring-item", { id }] as const,

  goals: () => ["goals"] as const,
  goal: (id?: string) => ["goal", { id }] as const,

  holdings: () => ["holdings"] as const,
  holding: (id?: string) => ["holding", { id }] as const,

  transfer: (id?: string) => ["transfer", { id }] as const,

  debts: () => ["debts"] as const,
  debt: (id?: string) => ["debt", { id }] as const,
  debtPlans: () => ["debt-plan"] as const,
  debtPlan: (extra: number) => ["debt-plan", { extra }] as const,

  rules: () => ["rules"] as const,
  rule: (id?: string) => ["rule", { id }] as const,

  views: () => ["views"] as const,

  settings: () => ["settings"] as const,
};

export const MONEY_DEPENDENT_KEYS = [
  queryKeys.summary(),
  queryKeys.netWorth(),
  queryKeys.forecast(),
  queryKeys.reports(),
  queryKeys.accounts(),
  queryKeys.categories(),
  queryKeys.transactions(),
  queryKeys.budgets(),
  queryKeys.holdings(),
  queryKeys.debts(),
  queryKeys.debtPlans(),
];

export const DEBT_DEPENDENT_KEYS = [
  queryKeys.debts(),
  queryKeys.debtPlans(),
  queryKeys.netWorth(),
];
