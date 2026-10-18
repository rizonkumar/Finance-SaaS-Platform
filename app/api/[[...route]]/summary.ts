import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { clerkMiddleware, getAuth } from "@clerk/hono";
import { subDays, differenceInDays } from "date-fns";
import { and, desc, eq, gte, lt, lte, sql, sum } from "drizzle-orm";

import { db } from "@/db/drizzle";
import { API_ERRORS } from "@/lib/messages";
import { DEFAULT_PERIOD_DAYS, TOP_CATEGORY_COUNT } from "@/lib/constants";
import { safeMaterialize } from "@/lib/recurring";
import { accounts, categories, transactions } from "@/db/schema";
import { calculatePercentageChange, fillMissingDays } from "@/lib/utils";

import { periodQuery, resolvePeriod } from "./_helpers";
import { NOT_A_TRADE, NOT_A_TRANSFER, spendingLines } from "./_ledger";

const EMPTY_PERIOD = { income: 0, expenses: 0, remaining: 0 };

const app = new Hono().get(
  "/",
  clerkMiddleware(),
  zValidator("query", periodQuery),
  async (c) => {
    const auth = getAuth(c);
    const { accountId, ...period } = c.req.valid("query");

    if (!auth?.userId) {
      return c.json({ error: API_ERRORS.unauthorized }, 401);
    }

    await safeMaterialize(auth.userId);

    const { startDate, endDate } = resolvePeriod(period, DEFAULT_PERIOD_DAYS);

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

    const lines = spendingLines(auth.userId, accountId);
    const spent = sql`SUM(ABS(${lines.amount}))`;

    const category = await db
      .select({
        name: categories.name,
        value: spent.mapWith(Number),
      })
      .from(lines)
      .innerJoin(categories, eq(lines.categoryId, categories.id))
      .where(
        and(
          lt(lines.amount, 0),
          gte(lines.date, startDate),
          lte(lines.date, endDate)
        )
      )
      .groupBy(categories.name)
      .orderBy(desc(spent));

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
