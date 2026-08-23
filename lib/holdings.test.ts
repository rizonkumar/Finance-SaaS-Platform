import { describe, expect, it } from "vitest";

import {
  QUANTITY_FACTOR,
  exceedsHolding,
  isPriceStale,
  marketValue,
  netQuantity,
  positionFromTrades,
  returnPercentage,
  signedQuantity,
  unrealisedGain,
  type Trade,
} from "@/lib/holdings";

const units = (count: number) => count * QUANTITY_FACTOR;
const rupees = (amount: number) => amount * 1000;

const buy = (quantity: number, price: number, fees = 0): Trade => ({
  side: "buy",
  quantity: units(quantity),
  price: rupees(price),
  fees: rupees(fees),
});

const sell = (quantity: number, price: number, fees = 0): Trade => ({
  side: "sell",
  quantity: units(quantity),
  price: rupees(price),
  fees: rupees(fees),
});

describe("positionFromTrades", () => {
  it("returns an empty position when nothing has been traded", () => {
    expect(positionFromTrades([])).toEqual({
      quantity: 0,
      costBasis: 0,
      avgCost: 0,
      realisedGain: 0,
    });
  });

  it("holds the cost basis of a single buy", () => {
    const position = positionFromTrades([buy(10, 300)]);

    expect(position.quantity).toBe(units(10));
    expect(position.costBasis).toBe(rupees(3_000));
    expect(position.avgCost).toBe(rupees(300));
  });

  it("weights the average cost across buys at different prices", () => {
    const position = positionFromTrades([buy(10, 300), buy(10, 500)]);

    expect(position.quantity).toBe(units(20));
    expect(position.costBasis).toBe(rupees(8_000));
    expect(position.avgCost).toBe(rupees(400));
  });

  it("folds fees into the cost basis rather than losing them", () => {
    const position = positionFromTrades([buy(10, 300, 20)]);

    expect(position.costBasis).toBe(rupees(3_020));
    expect(position.avgCost).toBe(rupees(302));
  });

  it("books a realised gain on a partial sell and keeps the average cost", () => {
    const position = positionFromTrades([buy(20, 300), sell(5, 400)]);

    expect(position.quantity).toBe(units(15));
    expect(position.costBasis).toBe(rupees(4_500));
    expect(position.avgCost).toBe(rupees(300));
    expect(position.realisedGain).toBe(rupees(500));
  });

  it("subtracts sell fees from the realised gain", () => {
    const position = positionFromTrades([buy(20, 300), sell(5, 400, 50)]);

    expect(position.realisedGain).toBe(rupees(450));
  });

  it("zeroes the cost basis when the position is fully closed", () => {
    const position = positionFromTrades([buy(10, 300), sell(10, 350)]);

    expect(position.quantity).toBe(0);
    expect(position.costBasis).toBe(0);
    expect(position.avgCost).toBe(0);
    expect(position.realisedGain).toBe(rupees(500));
  });

  it("books a loss when the sale is below the average cost", () => {
    const position = positionFromTrades([buy(10, 300), sell(10, 250)]);

    expect(position.realisedGain).toBe(rupees(-500));
  });

  it("never lets a sell drive the quantity below zero", () => {
    const position = positionFromTrades([buy(5, 300), sell(50, 300)]);

    expect(position.quantity).toBe(0);
  });

  it("round-trips fractional mutual fund units", () => {
    const position = positionFromTrades([
      { side: "buy", quantity: 12_345_678, price: rupees(100), fees: 0 },
    ]);

    expect(position.quantity).toBe(12_345_678);
    expect(position.costBasis).toBe(1_234_568);
    expect(position.avgCost).toBe(rupees(100));
  });
});

describe("signedQuantity", () => {
  it("treats a buy as an increase and a sell as a decrease", () => {
    expect(signedQuantity(buy(10, 300))).toBe(units(10));
    expect(signedQuantity(sell(4, 300))).toBe(units(-4));
  });
});

describe("marketValue", () => {
  it("prices a whole position at the latest price", () => {
    expect(marketValue(units(10), rupees(350))).toBe(rupees(3_500));
  });

  it("prices fractional units", () => {
    expect(marketValue(units(0.5), rupees(350))).toBe(rupees(175));
  });
});

describe("unrealisedGain", () => {
  it("reports the difference between market value and cost", () => {
    const position = positionFromTrades([buy(10, 300)]);

    expect(unrealisedGain(position, rupees(350))).toBe(rupees(500));
  });

  it("reports a negative gain when the price has fallen", () => {
    const position = positionFromTrades([buy(10, 300)]);

    expect(unrealisedGain(position, rupees(250))).toBe(rupees(-500));
  });

  it("is zero for a closed position", () => {
    const position = positionFromTrades([buy(10, 300), sell(10, 350)]);

    expect(unrealisedGain(position, rupees(350))).toBe(0);
  });
});

describe("returnPercentage", () => {
  it("expresses the gain against what was put in", () => {
    expect(returnPercentage(rupees(500), rupees(2_000))).toBe(25);
  });

  it("is zero when nothing was invested", () => {
    expect(returnPercentage(rupees(500), 0)).toBe(0);
  });
});

describe("netQuantity", () => {
  it("nets buys against sells", () => {
    expect(netQuantity([buy(10, 300), sell(4, 320)])).toBe(units(6));
  });

  it("goes negative when sells outweigh buys, so a bad delete is detectable", () => {
    expect(netQuantity([sell(4, 320)])).toBe(units(-4));
  });
});

describe("exceedsHolding", () => {
  it("rejects selling more than is held", () => {
    const position = positionFromTrades([buy(10, 300)]);

    expect(exceedsHolding(position, units(11))).toBe(true);
    expect(exceedsHolding(position, units(10))).toBe(false);
  });
});

describe("isPriceStale", () => {
  const now = new Date("2026-08-23T00:00:00.000Z");

  it("treats a never-priced holding as stale", () => {
    expect(isPriceStale(null, now, 7)).toBe(true);
  });

  it("accepts a price inside the window", () => {
    expect(isPriceStale(new Date("2026-08-20T00:00:00.000Z"), now, 7)).toBe(
      false
    );
  });

  it("flags a price older than the window", () => {
    expect(isPriceStale(new Date("2026-08-01T00:00:00.000Z"), now, 7)).toBe(
      true
    );
  });
});
