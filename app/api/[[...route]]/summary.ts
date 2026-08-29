import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { clerkMiddleware, getAuth } from "@clerk/hono";
import { subDays, parse, differenceInDays } from "date-fns";
import {
  and,
  desc,
  eq,
  gte,
  isNull,
  lt,
  lte,
  notExists,
  sql,
  sum,
} from "drizzle-orm";

import { db } from "@/db/drizzle";
import { API_ERRORS } from "@/lib/messages";
import {
  DATE_FORMAT,
  DEFAULT_PERIOD_DAYS,
  TOP_CATEGORY_COUNT,
} from "@/lib/constants";
import { materializeRecurringTransactions } from "@/lib/recurring";
import { accounts, categories, trades, transactions } from "@/db/schema";
import { calculatePercentageChange, fillMissingDays } from "@/lib/utils";

const EMPTY_PERIOD = { income: 0, expenses: 0, remaining: 0 };

const NOT_A_TRANSFER = isNull(transactions.transferId);

const NOT_A_TRADE = notExists(
  db
    .select({ one: sql`1` })
    .from(trades)
    .where(eq(trades.transactionId, transactions.id))
);

const app = new Hono().get(
  "/",
  clerkMiddleware(),
  zValidator(
    "query",
    z.object({
      from: z.string().optional(),
      to: z.string().optional(),
      accountId: z.string().optional(),
    })
  ),
  async (c) => {
    const auth = getAuth(c);
    const { from, to, accountId } = c.req.valid("query");

    if (!auth?.userId) {
      return c.json({ error: API_ERRORS.unauthorized }, 401);
    }

    try {
      await materializeRecurringTransactions(auth.userId);
    } catch (error) {
      console.error("[recurring] materialize failed", error);
    }

    const defaultTo = new Date();
    const defaultFrom = subDays(defaultTo, DEFAULT_PERIOD_DAYS);

    const startDate = from ? parse(from, DATE_FORMAT, new Date()) : defaultFrom;
    const endDate = to ? parse(to, DATE_FORMAT, new Date()) : defaultTo;

    const periodLength = differenceInDays(endDate, startDate) + 1;
    const lastPeriodStart = subDays(startDate, periodLength);
    const lastPeriodEnd = subDays(endDate, periodLength);

    async function fetchFinancialData(
      userId: string,
      startDate: Date,
      endDate: Date
    ) {
      return await db
        .select({
          income:
            sql`SUM(CASE WHEN ${transactions.amount} >= 0 THEN ${transactions.amount} ELSE 0 END)`.mapWith(
              Number
            ),
          expenses:
            sql`SUM(CASE WHEN ${transactions.amount} < 0 THEN ${transactions.amount} ELSE 0 END)`.mapWith(
              Number
            ),
          remaining: sum(transactions.amount).mapWith(Number),
        })
        .from(transactions)
        .innerJoin(accounts, eq(transactions.accountId, accounts.id))
        .where(
          and(
            accountId ? eq(transactions.accountId, accountId) : undefined,
            eq(accounts.userId, userId),
            NOT_A_TRANSFER,
            NOT_A_TRADE,
            NOT_A_TRADE,
            gte(transactions.date, startDate),
            lte(transactions.date, endDate)
          )
        );
    }

    const [currentPeriod] = await fetchFinancialData(
      auth.userId,
      startDate,
      endDate
    );
    const [lastPeriod] = await fetchFinancialData(
      auth.userId,
      lastPeriodStart,
      lastPeriodEnd
    );

    const current = currentPeriod ?? EMPTY_PERIOD;
    const previous = lastPeriod ?? EMPTY_PERIOD;

    const incomeChange = calculatePercentageChange(
      current.income,
      previous.income
    );
    const expensesChange = calculatePercentageChange(
      current.expenses,
      previous.expenses
    );
    const remainingChange = calculatePercentageChange(
      current.remaining,
      previous.remaining
    );

    const category = await db
      .select({
        name: categories.name,
        value: sql`SUM(ABS(${transactions.amount}))`.mapWith(Number),
      })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          accountId ? eq(transactions.accountId, accountId) : undefined,
          eq(accounts.userId, auth.userId),
          NOT_A_TRANSFER,
          NOT_A_TRADE,
          lt(transactions.amount, 0),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      )
      .groupBy(categories.name)
      .orderBy(desc(sql`SUM(ABS(${transactions.amount}))`));

    const topCategories = category.slice(0, TOP_CATEGORY_COUNT);
    const otherCategories = category.slice(TOP_CATEGORY_COUNT);
    const otherSum = otherCategories.reduce(
      (sum, current) => sum + current.value,
      0
    );

    const finalCategories = topCategories;
    if (otherCategories.length > 0) {
      finalCategories.push({
        name: "Other",
        value: otherSum,
      });
    }

    const activeDays = await db
      .select({
        date: transactions.date,
        income:
          sql`SUM(CASE WHEN ${transactions.amount} >= 0 THEN ${transactions.amount} ELSE 0 END)`.mapWith(
            Number
          ),
        expenses:
          sql`SUM(CASE WHEN ${transactions.amount} < 0 THEN ABS(${transactions.amount}) ELSE 0 END)`.mapWith(
            Number
          ),
      })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(
        and(
          accountId ? eq(transactions.accountId, accountId) : undefined,
          eq(accounts.userId, auth.userId),
          NOT_A_TRANSFER,
          NOT_A_TRADE,
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      )
      .groupBy(transactions.date)
      .orderBy(transactions.date);

    const days = fillMissingDays(activeDays, startDate, endDate);

    return c.json({
      data: {
        remainingAmount: current.remaining,
        remainingChange,
        incomeAmount: current.income,
        incomeChange,
        expensesAmount: current.expenses,
        expensesChange,
        categories: finalCategories,
        days,
      },
    });
  }
);

export default app;
