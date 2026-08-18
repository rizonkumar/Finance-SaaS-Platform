export const queryKeys = {
  summary: () => ["summary"] as const,

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
};

export const MONEY_DEPENDENT_KEYS = [
  queryKeys.summary(),
  queryKeys.transactions(),
  queryKeys.budgets(),
];
