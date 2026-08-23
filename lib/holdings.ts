export const QUANTITY_FACTOR = 1_000_000;

export type TradeSide = "buy" | "sell";

export type Trade = {
  side: TradeSide;
  quantity: number;
  price: number;
  fees: number;
};

export type HoldingPosition = {
  quantity: number;
  costBasis: number;
  avgCost: number;
  realisedGain: number;
};

const EMPTY_POSITION: HoldingPosition = {
  quantity: 0,
  costBasis: 0,
  avgCost: 0,
  realisedGain: 0,
};

const scaled = (quantity: number, perUnit: number) =>
  Math.round((quantity * perUnit) / QUANTITY_FACTOR);

const averageCost = (quantity: number, costBasis: number) =>
  quantity > 0 ? Math.round((costBasis * QUANTITY_FACTOR) / quantity) : 0;

export const marketValue = (quantity: number, lastPrice: number) =>
  scaled(quantity, lastPrice);

export const tradeValue = (trade: Pick<Trade, "quantity" | "price">) =>
  scaled(trade.quantity, trade.price);

export function positionFromTrades(trades: Trade[]): HoldingPosition {
  return trades.reduce<HoldingPosition>((position, trade) => {
    const value = tradeValue(trade);

    if (trade.side === "buy") {
      const quantity = position.quantity + trade.quantity;
      const costBasis = position.costBasis + value + trade.fees;

      return {
        quantity,
        costBasis,
        avgCost: averageCost(quantity, costBasis),
        realisedGain: position.realisedGain,
      };
    }

    const sold = Math.min(trade.quantity, position.quantity);
    const quantity = position.quantity - sold;
    const removed = scaled(sold, position.avgCost);
    const realisedGain = position.realisedGain + value - trade.fees - removed;
    const costBasis = quantity === 0 ? 0 : position.costBasis - removed;

    return {
      quantity,
      costBasis,
      avgCost: quantity === 0 ? 0 : position.avgCost,
      realisedGain,
    };
  }, EMPTY_POSITION);
}

export const signedQuantity = (trade: Pick<Trade, "side" | "quantity">) =>
  trade.side === "buy" ? trade.quantity : -trade.quantity;

export const unrealisedGain = (position: HoldingPosition, lastPrice: number) =>
  marketValue(position.quantity, lastPrice) - position.costBasis;

export const returnPercentage = (gain: number, costBasis: number) =>
  costBasis > 0 ? (gain / costBasis) * 100 : 0;

export const netQuantity = (trades: Pick<Trade, "side" | "quantity">[]) =>
  trades.reduce((total, trade) => total + signedQuantity(trade), 0);

export const exceedsHolding = (position: HoldingPosition, quantity: number) =>
  quantity > position.quantity;

export const isPriceStale = (
  lastPriceAt: Date | null,
  now: Date,
  maxAgeDays: number
) => {
  if (!lastPriceAt) return true;

  const ageMs = now.getTime() - lastPriceAt.getTime();

  return ageMs > maxAgeDays * 86_400_000;
};
