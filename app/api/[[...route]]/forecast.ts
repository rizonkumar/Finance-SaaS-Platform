import { clerkMiddleware } from "@hono/clerk-auth";
import { zValidator } from "@hono/zod-validator";
import { and, eq, lt, sum } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import { db } from "@/db/drizzle";
import {
  accounts,
  categories,
  recurringTransactions,
  transactions,
} from "@/db/schema";
import {
  DEFAULT_PERIOD_DAYS,
  DAY_PATTERN,
  MAX_TREND_DAYS,
} from "@/lib/constants";
import {
  addDaysUTC,
  eachDayUTC,
  endOfDayUTC,
  parseDayUTC,
  startOfDayUTC,
  toUtcNoon,
} from "@/lib/date-utc";
import { buildCashflowForecast } from "@/lib/forecast";

import { requireAuth, type AuthedEnv } from "./_middleware";

const dayQuery = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().regex(DAY_PATTERN).optional()
);

const forecastQuery = z.object({
  from: dayQuery,
  to: dayQuery,
  accountId: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().optional()
  ),
});

function resolveRange(from?: string, to?: string) {
  const firstDay = from ? parseDayUTC(from) : toUtcNoon(new Date());
  const requestedLastDay = to
    ? parseDayUTC(to)
    : addDaysUTC(firstDay, DEFAULT_PERIOD_DAYS);
  const days = eachDayUTC(firstDay, requestedLastDay, MAX_TREND_DAYS);

  return {
    days,
    start: startOfDayUTC(firstDay),
    end: endOfDayUTC(days.at(-1) ?? firstDay),
  };
}

function listAccounts(userId: string, accountId?: string) {
  return db
    .select({
      id: accounts.id,
      openingBalance: accounts.openingBalance,
    })
    .from(accounts)
    .where(
      and(
        eq(accounts.userId, userId),
        accountId ? eq(accounts.id, accountId) : undefined
      )
    );
}

function movementBefore(userId: string, start: Date, accountId?: string) {
  return db
    .select({
      accountId: transactions.accountId,
      amount: sum(transactions.amount).mapWith(Number),
    })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(
      and(
        eq(accounts.userId, userId),
        accountId ? eq(transactions.accountId, accountId) : undefined,
        lt(transactions.date, start)
      )
    )
    .groupBy(transactions.accountId);
}

function listTemplates(userId: string, accountId?: string) {
  return db
    .select({
      id: recurringTransactions.id,
      amount: recurringTransactions.amount,
      payee: recurringTransactions.payee,
      accountId: recurringTransactions.accountId,
      account: accounts.name,
      category: categories.name,
      frequency: recurringTransactions.frequency,
      interval: recurringTransactions.interval,
      startDate: recurringTransactions.startDate,
      endDate: recurringTransactions.endDate,
      isActive: recurringTransactions.isActive,
    })
    .from(recurringTransactions)
    .innerJoin(accounts, eq(recurringTransactions.accountId, accounts.id))
    .leftJoin(categories, eq(recurringTransactions.categoryId, categories.id))
    .where(
      and(
        eq(recurringTransactions.userId, userId),
        eq(accounts.userId, userId),
        accountId ? eq(recurringTransactions.accountId, accountId) : undefined
      )
    );
}

const app = new Hono<AuthedEnv>()
  .use("*", clerkMiddleware(), requireAuth)
  .get("/", zValidator("query", forecastQuery), async (c) => {
    const userId = c.get("userId");
    const { from, to, accountId } = c.req.valid("query");
    const { days, start } = resolveRange(from, to);

    const [ownedAccounts, priorMovement, templates] = await Promise.all([
      listAccounts(userId, accountId),
      movementBefore(userId, start, accountId),
      listTemplates(userId, accountId),
    ]);

    const data = buildCashflowForecast({
      days,
      accounts: ownedAccounts,
      movements: priorMovement.map((movement) => ({
        accountId: movement.accountId,
        amount: movement.amount ?? 0,
      })),
      templates,
      accountId,
    });

    return c.json({ data });
  });

export default app;
