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

import { ACCOUNT_TYPES } from "@/lib/net-worth";

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

export const transactionsRelations = relations(transactions, ({ one }) => ({
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
}));

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
    transactions: many(transactions),
  })
);

export const insertTransactionSchema = createInsertSchema(transactions, {
  date: z.coerce.date(),
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
    transactionId: text("transaction_id").references(() => transactions.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("goal_contributions_goal_id_idx").on(table.goalId),
    index("goal_contributions_user_id_idx").on(table.userId),
    index("goal_contributions_transaction_id_idx").on(table.transactionId),
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
