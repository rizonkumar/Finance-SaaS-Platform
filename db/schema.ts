import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { DEFAULT_WEEK_STARTS_ON } from "@/lib/budgets";
import { RULE_MATCHES } from "@/lib/category-rules";
import { CURRENCY_CODES, DEFAULT_CURRENCY_CODE } from "@/lib/currency";
import { ACCOUNT_TYPES } from "@/lib/net-worth";
import { MAX_SPLITS } from "@/lib/splits";

const bigInteger = (name: string) => bigint(name, { mode: "number" });

export const accountTypeEnum = pgEnum("account_type", ACCOUNT_TYPES);

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  plaidId: text("plaid_id"),
  name: text("name").notNull(),
  userId: text("user_id").notNull(),
  type: accountTypeEnum("type").notNull().default("savings"),
  openingBalance: bigInteger("opening_balance").notNull().default(0),
});

export const accountsRelations = relations(accounts, ({ many }) => ({
  transactions: many(transactions),
  recurring: many(recurringTransactions),
  goals: many(goals),
  debts: many(debts),
}));

export const insertAccountSchema = createInsertSchema(accounts, {
  name: z.string().trim().min(1, "Name is required"),
  openingBalance: z.coerce.number().int(),
});

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  plaidId: text("plaid_id"),
  name: text("name").notNull(),
  userId: text("user_id").notNull(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
  budgets: many(budgets),
  recurring: many(recurringTransactions),
  rules: many(categoryRules),
  splits: many(transactionSplits),
}));

export const insertCategorySchema = createInsertSchema(categories);

export const recurringFrequencyEnum = pgEnum("recurring_frequency", [
  "daily",
  "weekly",
  "monthly",
  "yearly",
]);

export const recurringTransactions = pgTable(
  "recurring_transactions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    amount: bigInteger("amount").notNull(),
    payee: text("payee").notNull(),
    notes: text("notes"),
    accountId: text("account_id")
      .references(() => accounts.id, { onDelete: "cascade" })
      .notNull(),
    toAccountId: text("to_account_id").references(() => accounts.id, {
      onDelete: "cascade",
    }),
    categoryId: text("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    debtId: text("debt_id").references(() => debts.id, {
      onDelete: "cascade",
    }),
    frequency: recurringFrequencyEnum("frequency").notNull(),
    interval: integer("interval").notNull().default(1),
    startDate: timestamp("start_date", { mode: "date" }).notNull(),
    endDate: timestamp("end_date", { mode: "date" }),
    lastGeneratedAt: timestamp("last_generated_at", { mode: "date" }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("recurring_transactions_user_active_idx").on(
      table.userId,
      table.isActive
    ),
    index("recurring_transactions_debt_id_idx").on(table.debtId),
  ]
);

export const transactions = pgTable(
  "transactions",
  {
    id: text("id").primaryKey(),
    amount: bigInteger("amount").notNull(),
    payee: text("payee").notNull(),
    notes: text("notes"),
    date: timestamp("date", { mode: "date" }).notNull(),
    accountId: text("account_id")
      .references(() => accounts.id, {
        onDelete: "cascade",
      })
      .notNull(),
    categoryId: text("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    recurringId: text("recurring_id").references(
      () => recurringTransactions.id,
      { onDelete: "set null" }
    ),
    transferId: text("transfer_id"),
  },
  (table) => [
    index("transactions_recurring_id_idx").on(table.recurringId),
    index("transactions_transfer_id_idx").on(table.transferId),
    index("transactions_account_id_date_idx").on(table.accountId, table.date),
    index("transactions_category_id_date_idx").on(table.categoryId, table.date),
  ]
);

export const transactionsRelations = relations(
  transactions,
  ({ one, many }) => ({
    account: one(accounts, {
      fields: [transactions.accountId],
      references: [accounts.id],
    }),
    categories: one(categories, {
      fields: [transactions.categoryId],
      references: [categories.id],
    }),
    recurring: one(recurringTransactions, {
      fields: [transactions.recurringId],
      references: [recurringTransactions.id],
    }),
    splits: many(transactionSplits),
  })
);

export const recurringTransactionsRelations = relations(
  recurringTransactions,
  ({ one, many }) => ({
    account: one(accounts, {
      fields: [recurringTransactions.accountId],
      references: [accounts.id],
    }),
    category: one(categories, {
      fields: [recurringTransactions.categoryId],
      references: [categories.id],
    }),
    debt: one(debts, {
      fields: [recurringTransactions.debtId],
      references: [debts.id],
    }),
    transactions: many(transactions),
  })
);

export const insertTransactionSchema = createInsertSchema(transactions, {
  date: z.coerce.date(),
});

export const transactionSplits = pgTable(
  "transaction_splits",
  {
    id: text("id").primaryKey(),
    transactionId: text("transaction_id")
      .references(() => transactions.id, { onDelete: "cascade" })
      .notNull(),
    categoryId: text("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    amount: bigInteger("amount").notNull(),
  },
  (table) => [
    index("transaction_splits_transaction_id_idx").on(table.transactionId),
    index("transaction_splits_category_id_idx").on(table.categoryId),
  ]
);

export const splitInputSchema = z.object({
  categoryId: z.string().nullable(),
  amount: z.coerce.number().int(),
});

export const transactionInputSchema = insertTransactionSchema
  .omit({ id: true, recurringId: true, transferId: true })
  .extend({ splits: z.array(splitInputSchema).max(MAX_SPLITS).optional() });

export const transactionSplitsRelations = relations(
  transactionSplits,
  ({ one }) => ({
    transaction: one(transactions, {
      fields: [transactionSplits.transactionId],
      references: [transactions.id],
    }),
    category: one(categories, {
      fields: [transactionSplits.categoryId],
      references: [categories.id],
    }),
  })
);

export const ruleMatchEnum = pgEnum("rule_match", RULE_MATCHES);

export const categoryRules = pgTable(
  "category_rules",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    pattern: text("pattern").notNull(),
    match: ruleMatchEnum("match").notNull().default("contains"),
    categoryId: text("category_id")
      .references(() => categories.id, { onDelete: "cascade" })
      .notNull(),
    priority: integer("priority").notNull().default(0),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("category_rules_user_id_idx").on(table.userId)]
);

export const categoryRulesRelations = relations(categoryRules, ({ one }) => ({
  category: one(categories, {
    fields: [categoryRules.categoryId],
    references: [categories.id],
  }),
}));

export const insertCategoryRuleSchema = createInsertSchema(categoryRules, {
  pattern: z.string().trim().min(1, "Enter the text to look for").max(100),
  categoryId: z.string("Choose a category").min(1, "Choose a category"),
  priority: z.coerce.number().int().min(0).max(100),
});

export const savedViews = pgTable(
  "saved_views",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    emoji: text("emoji"),
    route: text("route").notNull(),
    query: text("query").notNull().default(""),
    isPinned: boolean("is_pinned").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    lastOpenedAt: timestamp("last_opened_at", { mode: "date" }),
  },
  (table) => [index("saved_views_user_id_idx").on(table.userId)]
);

export const insertSavedViewSchema = createInsertSchema(savedViews, {
  name: z.string().trim().min(1, "Give the view a name").max(60),
  emoji: z.string().max(16).nullable().optional(),
  query: z.string().max(500),
});

export const userSettings = pgTable("user_settings", {
  userId: text("user_id").primaryKey(),
  currency: text("currency", { enum: CURRENCY_CODES })
    .notNull()
    .default(DEFAULT_CURRENCY_CODE),
  weekStartsOn: integer("week_starts_on")
    .notNull()
    .default(DEFAULT_WEEK_STARTS_ON),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const insertUserSettingsSchema = createInsertSchema(userSettings, {
  weekStartsOn: z.coerce.number().int().min(0).max(1),
});

export const insertRecurringTransactionSchema = createInsertSchema(
  recurringTransactions,
  {
    startDate: z.coerce.date(),
    endDate: z.coerce.date().nullable().optional(),
    interval: z.coerce.number().int().min(1).max(365),
    amount: z.coerce.number().int(),
  }
);

export const budgetPeriodEnum = pgEnum("budget_period", [
  "weekly",
  "monthly",
  "yearly",
  "custom",
]);

export const budgets = pgTable(
  "budgets",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    categoryId: text("category_id").references(() => categories.id, {
      onDelete: "cascade",
    }),
    amount: bigInteger("amount").notNull(),
    period: budgetPeriodEnum("period").notNull().default("monthly"),
    startDate: timestamp("start_date", { mode: "date" }).notNull(),
    endDate: timestamp("end_date", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("budgets_user_id_idx").on(table.userId),
    uniqueIndex("budgets_user_category_period_idx")
      .on(table.userId, table.categoryId, table.period)
      .where(sql`${table.categoryId} is not null`),
    uniqueIndex("budgets_user_overall_period_idx")
      .on(table.userId, table.period)
      .where(sql`${table.categoryId} is null`),
  ]
);

export const budgetsRelations = relations(budgets, ({ one }) => ({
  category: one(categories, {
    fields: [budgets.categoryId],
    references: [categories.id],
  }),
}));

export const insertBudgetSchema = createInsertSchema(budgets, {
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  amount: z.coerce.number().int().positive(),
});

export const goals = pgTable(
  "goals",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    targetAmount: bigInteger("target_amount").notNull(),
    accountId: text("account_id").references(() => accounts.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    startDate: timestamp("start_date", { mode: "date" }).notNull(),
    targetDate: timestamp("target_date", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("goals_user_id_idx").on(table.userId),
    uniqueIndex("goals_user_name_idx").on(table.userId, table.name),
  ]
);

export const goalContributions = pgTable(
  "goal_contributions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    goalId: text("goal_id")
      .references(() => goals.id, { onDelete: "cascade" })
      .notNull(),
    amount: bigInteger("amount").notNull(),
    notes: text("notes"),
    date: timestamp("date", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("goal_contributions_goal_id_idx").on(table.goalId),
    index("goal_contributions_user_id_idx").on(table.userId),
  ]
);

export const goalsRelations = relations(goals, ({ one, many }) => ({
  account: one(accounts, {
    fields: [goals.accountId],
    references: [accounts.id],
  }),
  contributions: many(goalContributions),
}));

export const goalContributionsRelations = relations(
  goalContributions,
  ({ one }) => ({
    goal: one(goals, {
      fields: [goalContributions.goalId],
      references: [goals.id],
    }),
  })
);

export const insertGoalSchema = createInsertSchema(goals, {
  name: z.string().trim().min(1, "Name is required"),
  startDate: z.coerce.date(),
  targetDate: z.coerce.date().nullable().optional(),
  targetAmount: z.coerce.number().int().positive(),
});

export const insertGoalContributionSchema = createInsertSchema(
  goalContributions,
  {
    date: z.coerce.date(),
    amount: z.coerce.number().int(),
  }
);

export const debtKindEnum = pgEnum("debt_kind", [
  "loan",
  "credit-card",
  "other",
]);

export const debts = pgTable(
  "debts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    kind: debtKindEnum("kind").notNull().default("loan"),
    principal: bigInteger("principal").notNull(),
    aprBasisPoints: integer("apr_basis_points").notNull().default(0),
    minimumPayment: bigInteger("minimum_payment").notNull().default(0),
    accountId: text("account_id").references(() => accounts.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    startDate: timestamp("start_date", { mode: "date" }).notNull(),
    targetDate: timestamp("target_date", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("debts_user_id_idx").on(table.userId),
    uniqueIndex("debts_user_name_idx").on(table.userId, table.name),
  ]
);

export const debtPayments = pgTable(
  "debt_payments",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    debtId: text("debt_id")
      .references(() => debts.id, { onDelete: "cascade" })
      .notNull(),
    amount: bigInteger("amount").notNull(),
    notes: text("notes"),
    date: timestamp("date", { mode: "date" }).notNull(),
    transactionId: text("transaction_id").references(() => transactions.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("debt_payments_debt_id_idx").on(table.debtId),
    index("debt_payments_user_id_idx").on(table.userId),
    index("debt_payments_transaction_id_idx").on(table.transactionId),
  ]
);

export const debtsRelations = relations(debts, ({ one, many }) => ({
  account: one(accounts, {
    fields: [debts.accountId],
    references: [accounts.id],
  }),
  payments: many(debtPayments),
  schedules: many(recurringTransactions),
}));

export const debtPaymentsRelations = relations(debtPayments, ({ one }) => ({
  debt: one(debts, {
    fields: [debtPayments.debtId],
    references: [debts.id],
  }),
}));

export const insertDebtSchema = createInsertSchema(debts, {
  name: z.string().trim().min(1, "Name is required"),
  startDate: z.coerce.date(),
  targetDate: z.coerce.date().nullable().optional(),
  principal: z.coerce.number().int().positive(),
  aprBasisPoints: z.coerce.number().int().min(0).max(100_000),
  minimumPayment: z.coerce.number().int().min(0),
});

export const insertDebtPaymentSchema = createInsertSchema(debtPayments, {
  date: z.coerce.date(),
  amount: z.coerce.number().int(),
});

export const tradeSideEnum = pgEnum("trade_side", ["buy", "sell"]);

export const holdings = pgTable(
  "holdings",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    accountId: text("account_id")
      .references(() => accounts.id, { onDelete: "cascade" })
      .notNull(),
    symbol: text("symbol").notNull(),
    name: text("name").notNull(),
    lastPrice: bigInteger("last_price").notNull().default(0),
    lastPriceAt: timestamp("last_price_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("holdings_user_id_idx").on(table.userId),
    index("holdings_account_id_idx").on(table.accountId),
    uniqueIndex("holdings_user_account_symbol_idx").on(
      table.userId,
      table.accountId,
      table.symbol
    ),
  ]
);

export const trades = pgTable(
  "trades",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    holdingId: text("holding_id")
      .references(() => holdings.id, { onDelete: "cascade" })
      .notNull(),
    transactionId: text("transaction_id").references(() => transactions.id, {
      onDelete: "cascade",
    }),
    side: tradeSideEnum("side").notNull(),
    quantity: bigInteger("quantity").notNull(),
    price: bigInteger("price").notNull(),
    fees: bigInteger("fees").notNull().default(0),
    date: timestamp("date", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("trades_holding_id_idx").on(table.holdingId),
    index("trades_user_id_idx").on(table.userId),
    index("trades_transaction_id_idx").on(table.transactionId),
  ]
);

export const holdingsRelations = relations(holdings, ({ one, many }) => ({
  account: one(accounts, {
    fields: [holdings.accountId],
    references: [accounts.id],
  }),
  trades: many(trades),
}));

export const tradesRelations = relations(trades, ({ one }) => ({
  holding: one(holdings, {
    fields: [trades.holdingId],
    references: [holdings.id],
  }),
  transaction: one(transactions, {
    fields: [trades.transactionId],
    references: [transactions.id],
  }),
}));

export const insertHoldingSchema = createInsertSchema(holdings, {
  symbol: z.string().trim().min(1, "Enter a symbol"),
  name: z.string().trim().min(1, "Enter a name"),
  lastPrice: z.coerce.number().int().min(0),
  lastPriceAt: z.coerce.date().nullable().optional(),
});

export const insertTradeSchema = createInsertSchema(trades, {
  quantity: z.coerce.number().int().positive(),
  price: z.coerce.number().int().min(0),
  fees: z.coerce.number().int().min(0),
  date: z.coerce.date(),
});
