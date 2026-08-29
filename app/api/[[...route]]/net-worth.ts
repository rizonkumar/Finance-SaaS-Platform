import { zValidator } from "@hono/zod-validator";
import { clerkMiddleware } from "@clerk/hono";
import { and, eq, gte, lt, lte, sql, sum } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import { db } from "@/db/drizzle";
import {
  accounts,
  debtPayments,
  debts,
  holdings,
  trades,
  transactions,
} from "@/db/schema";
import {
  DAY_PATTERN,
  DEFAULT_PERIOD_DAYS,
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
import { marketValue, signedQuantity } from "@/lib/holdings";
import {
  buildBalanceSheet,
  buildNetWorthSeries,
  netWorthChange,
  type AccountDelta,
  type DailyDelta,
} from "@/lib/net-worth";
import { materializeRecurringTransactions } from "@/lib/recurring";

import { requireAuth, type AuthedEnv } from "./_middleware";

const dayQuery = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().regex(DAY_PATTERN).optional()
);

const rangeQuery = z.object({ from: dayQuery, to: dayQuery });

const transactionDay = sql<Date>`date_trunc('day', ${transactions.date})`;
const paymentDay = sql<Date>`date_trunc('day', ${debtPayments.date})`;
const debtStartDay = sql<Date>`date_trunc('day', ${debts.startDate})`;

function resolveRange(from?: string, to?: string) {
  const lastDay = to ? parseDayUTC(to) : toUtcNoon(new Date());
  const firstDay = from
    ? parseDayUTC(from)
    : addDaysUTC(lastDay, -DEFAULT_PERIOD_DAYS);

  const days = eachDayUTC(firstDay, lastDay, MAX_TREND_DAYS);

  return {
    days,
    start: startOfDayUTC(firstDay),
    end: endOfDayUTC(days.at(-1) ?? firstDay),
  };
}

function listAccounts(userId: string) {
  return db
    .select({
      id: accounts.id,
      name: accounts.name,
      type: accounts.type,
      openingBalance: accounts.openingBalance,
    })
    .from(accounts)
    .where(eq(accounts.userId, userId))
    .orderBy(accounts.name);
}

function pricedTrades(userId: string) {
  return db
    .select({
      date: trades.date,
      side: trades.side,
      quantity: trades.quantity,
      lastPrice: holdings.lastPrice,
    })
    .from(trades)
    .innerJoin(holdings, eq(trades.holdingId, holdings.id))
    .where(eq(trades.userId, userId));
}

function movementBefore(userId: string, start: Date) {
  return db
    .select({
      accountId: transactions.accountId,
      amount: sum(transactions.amount).mapWith(Number),
    })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(and(eq(accounts.userId, userId), lt(transactions.date, start)))
    .groupBy(transactions.accountId);
}

function movementWithin(userId: string, start: Date, end: Date) {
  return db
    .select({
      accountId: transactions.accountId,
      date: transactionDay,
      amount: sum(transactions.amount).mapWith(Number),
    })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(
      and(
        eq(accounts.userId, userId),
        gte(transactions.date, start),
        lte(transactions.date, end)
      )
    )
    .groupBy(transactions.accountId, transactionDay);
}

function borrowedWithin(userId: string, start: Date, end: Date) {
  return db
    .select({
      date: debtStartDay,
      amount: sum(debts.principal).mapWith(Number),
    })
    .from(debts)
    .where(
      and(
        eq(debts.userId, userId),
        gte(debts.startDate, start),
        lte(debts.startDate, end)
      )
    )
    .groupBy(debtStartDay);
}

function clearedWithin(userId: string, start: Date, end: Date) {
  return db
    .select({
      date: paymentDay,
      amount: sum(debtPayments.amount).mapWith(Number),
    })
    .from(debtPayments)
    .where(
      and(
        eq(debtPayments.userId, userId),
        gte(debtPayments.date, start),
        lte(debtPayments.date, end)
      )
    )
    .groupBy(paymentDay);
}

async function debtBefore(userId: string, start: Date) {
  const [borrowed, cleared] = await Promise.all([
    db
      .select({ total: sum(debts.principal).mapWith(Number) })
      .from(debts)
      .where(and(eq(debts.userId, userId), lt(debts.startDate, start))),
    db
      .select({ total: sum(debtPayments.amount).mapWith(Number) })
      .from(debtPayments)
      .where(
        and(eq(debtPayments.userId, userId), lt(debtPayments.date, start))
      ),
  ]);

  return (borrowed.at(0)?.total ?? 0) - (cleared.at(0)?.total ?? 0);
}

const app = new Hono<AuthedEnv>()
  .use("*", clerkMiddleware(), requireAuth)
  .get("/", zValidator("query", rangeQuery), async (c) => {
    const userId = c.get("userId");
    const { from, to } = c.req.valid("query");
    const { days, start, end } = resolveRange(from, to);

    try {
      await materializeRecurringTransactions(userId);
    } catch (error) {
      console.error("[recurring] materialize failed", error);
    }

    const [
      ownedAccounts,
      priorMovement,
      dailyMovement,
      borrowed,
      cleared,
      priorDebt,
      holdingTrades,
    ] = await Promise.all([
      listAccounts(userId),
      movementBefore(userId, start),
      movementWithin(userId, start, end),
      borrowedWithin(userId, start, end),
      clearedWithin(userId, start, end),
      debtBefore(userId, start),
      pricedTrades(userId),
    ]);

    const priorByAccount = new Map(
      priorMovement.map((row) => [row.accountId, row.amount])
    );

    const startingBalances = ownedAccounts.map((account) => ({
      id: account.id,
      balance: account.openingBalance + (priorByAccount.get(account.id) ?? 0),
    }));

    const deltas: AccountDelta[] = dailyMovement.map((row) => ({
      accountId: row.accountId,
      date: new Date(row.date),
      amount: row.amount,
    }));

    const debtDeltas: DailyDelta[] = [
      ...borrowed.map((row) => ({
        date: new Date(row.date),
        amount: row.amount,
      })),
      ...cleared.map((row) => ({
        date: new Date(row.date),
        amount: -row.amount,
      })),
    ];

    const startingHoldingsValue = holdingTrades
      .filter((trade) => trade.date < start)
      .reduce(
        (total, trade) =>
          total + marketValue(signedQuantity(trade), trade.lastPrice),
        0
      );

    const holdingsDeltas: DailyDelta[] = holdingTrades
      .filter((trade) => trade.date >= start && trade.date <= end)
      .map((trade) => ({
        date: new Date(trade.date),
        amount: marketValue(signedQuantity(trade), trade.lastPrice),
      }));

    const closingHoldingsValue = holdingsDeltas.reduce(
      (total, delta) => total + delta.amount,
      startingHoldingsValue
    );

    const balanceByAccount = new Map(
      startingBalances.map((account) => [account.id, account.balance])
    );

    for (const delta of deltas) {
      balanceByAccount.set(
        delta.accountId,
        (balanceByAccount.get(delta.accountId) ?? 0) + delta.amount
      );
    }

    const positions = ownedAccounts.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      balance: balanceByAccount.get(account.id) ?? 0,
    }));

    const closingDebt = debtDeltas.reduce(
      (total, delta) => total + delta.amount,
      priorDebt
    );

    const series = buildNetWorthSeries({
      days,
      startingBalances,
      deltas,
      startingDebt: priorDebt,
      debtDeltas,
      startingHoldingsValue,
      holdingsDeltas,
    });

    return c.json({
      data: {
        ...buildBalanceSheet(positions, closingDebt, closingHoldingsValue),
        holdingsValue: closingHoldingsValue,
        change: netWorthChange(series),
        positions,
        days: series,
      },
    });
  });

export default app;
