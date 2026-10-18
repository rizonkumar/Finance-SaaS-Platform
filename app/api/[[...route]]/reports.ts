import { clerkMiddleware } from "@clerk/hono";
import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, gte, lt, lte, sql } from "drizzle-orm";
import { Hono } from "hono";

import { db } from "@/db/drizzle";
import { categories } from "@/db/schema";
import { shiftMinutes } from "@/lib/date-utc";
import { safeMaterialize } from "@/lib/recurring";
import {
  buildCategoryTrend,
  buildMonthlyFlow,
  monthsBetween,
  REPORT_PERIOD_DAYS,
  REPORT_TOP_PAYEES,
  summarizeFlow,
} from "@/lib/reports";

import { periodQuery, resolvePeriod } from "./_helpers";
import { expensesOf, incomeOf, spendingLines } from "./_ledger";
import { requireAuth, type AuthedEnv } from "./_middleware";

const app = new Hono<AuthedEnv>()
  .use("*", clerkMiddleware(), requireAuth)
  .get("/", zValidator("query", periodQuery), async (c) => {
    const userId = c.get("userId");
    const { accountId, ...period } = c.req.valid("query");
    const { startDate, endDate } = resolvePeriod(period, REPORT_PERIOD_DAYS);

    await safeMaterialize(userId);

    const ledger = spendingLines(userId, accountId);
    const inPeriod = and(
      gte(ledger.date, startDate),
      lte(ledger.date, endDate)
    );
    const spent = expensesOf(ledger);

    const [daily, payees] = await Promise.all([
      db
        .select({
          date: ledger.date,
          category: categories.name,
          income: incomeOf(ledger),
          expenses: spent,
        })
        .from(ledger)
        .leftJoin(categories, eq(ledger.categoryId, categories.id))
        .where(inPeriod)
        .groupBy(ledger.date, categories.name),
      db
        .select({
          payee: ledger.payee,
          total: spent,
          count: sql<number>`count(distinct ${ledger.transactionId})`.mapWith(
            Number
          ),
        })
        .from(ledger)
        .where(and(inPeriod, lt(ledger.amount, 0)))
        .groupBy(ledger.payee)
        .orderBy(desc(spent))
        .limit(REPORT_TOP_PAYEES),
    ]);

    const toLocal = (date: Date) => shiftMinutes(date, -(period.tzOffset ?? 0));
    const lines = daily.map((row) => ({ ...row, date: toLocal(row.date) }));
    const months = monthsBetween(toLocal(startDate), toLocal(endDate));
    const monthly = buildMonthlyFlow(lines, months);

    return c.json({
      data: {
        months,
        totals: summarizeFlow(monthly),
        monthly,
        categories: buildCategoryTrend(lines, months),
        payees,
      },
    });
  });

export default app;
