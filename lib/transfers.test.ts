import { describe, expect, it } from "vitest";

import {
  buildTransferLegs,
  readTransferLegs,
  transferPayee,
} from "@/lib/transfers";

const date = new Date("2026-03-01T12:00:00.000Z");

const input = {
  amount: 50_000,
  date,
  notes: "Monthly top-up",
  source: { id: "acc_current", name: "Current Account" },
  destination: { id: "acc_savings", name: "Savings" },
};

describe("transferPayee", () => {
  it("names the destination on the way out", () => {
    expect(transferPayee("out", "Savings")).toBe("Transfer to Savings");
  });

  it("names the source on the way in", () => {
    expect(transferPayee("in", "Current Account")).toBe(
      "Transfer from Current Account"
    );
  });
});

describe("buildTransferLegs", () => {
  it("debits the source and credits the destination", () => {
    const [source, destination] = buildTransferLegs(input);

    expect(source.accountId).toBe("acc_current");
    expect(source.amount).toBe(-50_000);
    expect(destination.accountId).toBe("acc_savings");
    expect(destination.amount).toBe(50_000);
  });

  it("nets to zero, so a transfer cannot move the overall total", () => {
    const legs = buildTransferLegs(input);

    expect(legs[0].amount + legs[1].amount).toBe(0);
  });

  it("ignores the sign it was handed", () => {
    const legs = buildTransferLegs({ ...input, amount: -50_000 });

    expect(legs[0].amount).toBe(-50_000);
    expect(legs[1].amount).toBe(50_000);
  });

  it("labels each leg with the other account", () => {
    const [source, destination] = buildTransferLegs(input);

    expect(source.payee).toBe("Transfer to Savings");
    expect(destination.payee).toBe("Transfer from Current Account");
  });

  it("copies the date and notes onto both legs", () => {
    const legs = buildTransferLegs(input);

    for (const leg of legs) {
      expect(leg.date).toBe(date);
      expect(leg.notes).toBe("Monthly top-up");
    }
  });
});

describe("readTransferLegs", () => {
  it("splits a stored pair by sign, whatever order it arrives in", () => {
    const rows = [{ amount: 50_000 }, { amount: -50_000 }];

    expect(readTransferLegs(rows)).toEqual({
      source: { amount: -50_000 },
      destination: { amount: 50_000 },
    });
  });

  it("rejects a pair that is missing a leg", () => {
    expect(readTransferLegs([{ amount: -50_000 }])).toBeNull();
  });

  it("rejects two legs pointing the same way", () => {
    expect(readTransferLegs([{ amount: -1000 }, { amount: -1000 }])).toBeNull();
  });

  it("rejects a zero leg rather than guessing its direction", () => {
    expect(readTransferLegs([{ amount: 0 }, { amount: 0 }])).toBeNull();
  });
});
