import { and, eq, isNull, notExists, sql } from "drizzle-orm";

import { db } from "@/db/drizzle";
import { accounts, trades, transactionSplits, transactions } from "@/db/schema";

export const NOT_A_TRANSFER = isNull(transactions.transferId);

export const NOT_A_TRADE = notExists(
  db
    .select({ one: sql`1` })
    .from(trades)
    .where(eq(trades.transactionId, transactions.id))
);

export function spendingLines(userId: string, accountId?: string) {
  return db
    .select({
      transactionId: transactions.id,
      date: transactions.date,
      payee: transactions.payee,
      categoryId: sql<
        string | null
      >`coalesce(${transactionSplits.categoryId}, ${transactions.categoryId})`.as(
        "line_category_id"
      ),
      amount:
        sql<number>`coalesce(${transactionSplits.amount}, ${transactions.amount})`
          .mapWith(Number)
          .as("line_amount"),
    })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .leftJoin(
      transactionSplits,
      eq(transactionSplits.transactionId, transactions.id)
    )
    .where(
      and(
        eq(accounts.userId, userId),
        accountId ? eq(transactions.accountId, accountId) : undefined,
        NOT_A_TRANSFER,
        NOT_A_TRADE
      )
    )
    .as("spending_lines");
}

export type SpendingLines = ReturnType<typeof spendingLines>;

export const incomeOf = (lines: SpendingLines) =>
  sql<number>`coalesce(sum(case when ${lines.amount} > 0 then ${lines.amount} else 0 end), 0)`.mapWith(
    Number
  );

export const expensesOf = (lines: SpendingLines) =>
  sql<number>`coalesce(sum(case when ${lines.amount} < 0 then abs(${lines.amount}) else 0 end), 0)`.mapWith(
    Number
  );
