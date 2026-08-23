import { clerkMiddleware } from "@hono/clerk-auth";
import { zValidator } from "@hono/zod-validator";
import { createId } from "@paralleldrive/cuid2";
import { and, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import { db } from "@/db/drizzle";
import {
  accounts,
  holdings,
  insertHoldingSchema,
  insertTradeSchema,
  trades,
  transactions,
} from "@/db/schema";
import {
  exceedsHolding,
  marketValue,
  positionFromTrades,
  returnPercentage,
  tradeValue,
  unrealisedGain,
  type Trade,
} from "@/lib/holdings";
import { API_ERRORS } from "@/lib/messages";

import { assertAccountOwned, requireId } from "./_helpers";
import { requireAuth, type AuthedEnv } from "./_middleware";

const MAX_HOLDINGS = 200;

const idParam = z.object({ id: z.string().optional() });
const tradeParam = idParam.extend({ tradeId: z.string().optional() });

const holdingBody = insertHoldingSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

const priceBody = z.object({ lastPrice: z.coerce.number().int().min(0) });

const tradeBody = insertTradeSchema
  .omit({ id: true, userId: true, holdingId: true, createdAt: true })
  .extend({ transactionId: z.undefined().optional() });

type HoldingRow = typeof holdings.$inferSelect;

async function requireHolding(userId: string, holdingId: string) {
  const [owned] = await db
    .select()
    .from(holdings)
    .where(and(eq(holdings.userId, userId), eq(holdings.id, holdingId)));

  if (!owned) {
    throw new HTTPException(404, { message: API_ERRORS.notFound });
  }

  return owned;
}

type TradeRow = {
  id: string;
  holdingId: string;
  side: Trade["side"];
  quantity: number;
  price: number;
  fees: number;
  date: Date;
};

function loadTrades(userId: string, holdingIds: string[]): Promise<TradeRow[]> {
  if (holdingIds.length === 0) return Promise.resolve([]);

  return db
    .select({
      id: trades.id,
      holdingId: trades.holdingId,
      side: trades.side,
      quantity: trades.quantity,
      price: trades.price,
      fees: trades.fees,
      date: trades.date,
    })
    .from(trades)
    .where(
      and(eq(trades.userId, userId), inArray(trades.holdingId, holdingIds))
    )
    .orderBy(trades.date, trades.createdAt);
}

async function withPosition(userId: string, rows: HoldingRow[]) {
  const tradeRows = await loadTrades(
    userId,
    rows.map((row) => row.id)
  );

  const byHolding = new Map<string, TradeRow[]>();

  for (const trade of tradeRows) {
    const bucket = byHolding.get(trade.holdingId) ?? [];

    bucket.push(trade);
    byHolding.set(trade.holdingId, bucket);
  }

  return rows.map((row) => {
    const position = positionFromTrades(byHolding.get(row.id) ?? []);
    const value = marketValue(position.quantity, row.lastPrice);
    const gain = unrealisedGain(position, row.lastPrice);

    return {
      ...row,
      ...position,
      marketValue: value,
      unrealisedGain: gain,
      returnPercentage: returnPercentage(gain, position.costBasis),
      trades: (byHolding.get(row.id) ?? []).map((trade) => ({
        ...trade,
        value: tradeValue(trade),
      })),
    };
  });
}

const app = new Hono<AuthedEnv>()
  .use("*", clerkMiddleware(), requireAuth)
  .get("/", async (c) => {
    const userId = c.get("userId");

    const rows = await db
      .select({ holding: holdings, account: accounts.name })
      .from(holdings)
      .innerJoin(accounts, eq(holdings.accountId, accounts.id))
      .where(eq(holdings.userId, userId))
      .orderBy(holdings.symbol)
      .limit(MAX_HOLDINGS);

    const priced = await withPosition(
      userId,
      rows.map((row) => row.holding)
    );

    const accountById = new Map(
      rows.map((row) => [row.holding.id, row.account])
    );

    return c.json({
      data: priced.map((row) => ({
        ...row,
        account: accountById.get(row.id) ?? "",
      })),
    });
  })
  .get("/:id", zValidator("param", idParam), async (c) => {
    const userId = c.get("userId");
    const holding = await requireHolding(
      userId,
      requireId(c.req.valid("param").id)
    );

    const [data] = await withPosition(userId, [holding]);

    return c.json({ data });
  })
  .post("/", zValidator("json", holdingBody), async (c) => {
    const userId = c.get("userId");
    const values = c.req.valid("json");

    await assertAccountOwned(userId, values.accountId);

    const [data] = await db
      .insert(holdings)
      .values({
        ...values,
        symbol: values.symbol.toUpperCase(),
        lastPriceAt: values.lastPrice ? new Date() : null,
        id: createId(),
        userId,
      })
      .returning();

    return c.json({ data });
  })
  .patch(
    "/:id",
    zValidator("param", idParam),
    zValidator("json", holdingBody),
    async (c) => {
      const userId = c.get("userId");
      const holding = await requireHolding(
        userId,
        requireId(c.req.valid("param").id)
      );
      const values = c.req.valid("json");

      await assertAccountOwned(userId, values.accountId);

      const [data] = await db
        .update(holdings)
        .set({
          ...values,
          symbol: values.symbol.toUpperCase(),
          updatedAt: new Date(),
        })
        .where(eq(holdings.id, holding.id))
        .returning();

      return c.json({ data });
    }
  )
  .patch(
    "/:id/price",
    zValidator("param", idParam),
    zValidator("json", priceBody),
    async (c) => {
      const userId = c.get("userId");
      const holding = await requireHolding(
        userId,
        requireId(c.req.valid("param").id)
      );

      const [data] = await db
        .update(holdings)
        .set({
          lastPrice: c.req.valid("json").lastPrice,
          lastPriceAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(holdings.id, holding.id))
        .returning();

      return c.json({ data });
    }
  )
  .delete("/:id", zValidator("param", idParam), async (c) => {
    const userId = c.get("userId");
    const holding = await requireHolding(
      userId,
      requireId(c.req.valid("param").id)
    );

    const [data] = await db
      .delete(holdings)
      .where(eq(holdings.id, holding.id))
      .returning({ id: holdings.id });

    return c.json({ data });
  })
  .post(
    "/:id/trades",
    zValidator("param", idParam),
    zValidator("json", tradeBody),
    async (c) => {
      const userId = c.get("userId");
      const holding = await requireHolding(
        userId,
        requireId(c.req.valid("param").id)
      );
      const values = c.req.valid("json");

      if (values.side === "sell") {
        const existing = await loadTrades(userId, [holding.id]);

        if (exceedsHolding(positionFromTrades(existing), values.quantity)) {
          throw new HTTPException(400, {
            message: "That is more than this holding contains",
          });
        }
      }

      const gross = tradeValue(values);
      const fees = values.fees ?? 0;
      const cash = values.side === "buy" ? -(gross + fees) : gross - fees;

      const data = await db.transaction(async (tx) => {
        const [movement] = await tx
          .insert(transactions)
          .values({
            id: createId(),
            amount: cash,
            payee: `${values.side === "buy" ? "Buy" : "Sell"}: ${holding.symbol}`,
            notes: null,
            date: values.date,
            accountId: holding.accountId,
            categoryId: null,
          })
          .returning({ id: transactions.id });

        const [trade] = await tx
          .insert(trades)
          .values({
            id: createId(),
            userId,
            holdingId: holding.id,
            transactionId: movement?.id ?? null,
            side: values.side,
            quantity: values.quantity,
            price: values.price,
            fees,
            date: values.date,
          })
          .returning();

        await tx
          .update(holdings)
          .set({
            lastPrice: values.price,
            lastPriceAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(holdings.id, holding.id));

        return trade;
      });

      return c.json({ data });
    }
  )
  .delete(
    "/:id/trades/:tradeId",
    zValidator("param", tradeParam),
    async (c) => {
      const userId = c.get("userId");
      const { id, tradeId } = c.req.valid("param");
      const holding = await requireHolding(userId, requireId(id));

      const data = await db.transaction(async (tx) => {
        const [removed] = await tx
          .delete(trades)
          .where(
            and(
              eq(trades.userId, userId),
              eq(trades.holdingId, holding.id),
              eq(trades.id, requireId(tradeId))
            )
          )
          .returning({ id: trades.id, transactionId: trades.transactionId });

        if (!removed) return null;

        if (removed.transactionId) {
          await tx
            .delete(transactions)
            .where(eq(transactions.id, removed.transactionId));
        }

        return { id: removed.id };
      });

      if (!data) {
        throw new HTTPException(404, { message: API_ERRORS.notFound });
      }

      return c.json({ data });
    }
  );

export default app;
