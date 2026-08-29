import { describe, expect, it } from "vitest";

import {
  aprFromBasisPoints,
  aprToBasisPoints,
  comparePayoffStrategies,
  debtStatus,
  MAX_PROJECTION_MONTHS,
  monthlyInterest,
  monthlyRate,
  monthsToPayoff,
  monthsUntil,
  orderDebts,
  outstandingBalance,
  payoffPercentage,
  projectedPayoffDate,
  requiredPayment,
  scheduleDefaultsForDebt,
  simulatePayoff,
  totalInterest,
} from "@/lib/debts";

const utc = (iso: string) => new Date(`${iso}T12:00:00.000Z`);

describe("apr conversion", () => {
  it("reads basis points as a percentage", () => {
    expect(aprFromBasisPoints(1899)).toBeCloseTo(18.99, 10);
  });

  it("stores a typed percentage as whole basis points", () => {
    expect(aprToBasisPoints(18.99)).toBe(1899);
    expect(aprToBasisPoints(7)).toBe(700);
  });

  it("round-trips", () => {
    expect(aprFromBasisPoints(aprToBasisPoints(24.5))).toBeCloseTo(24.5, 10);
  });
});

describe("monthlyRate", () => {
  it("splits an APR in basis points across the year", () => {
    expect(monthlyRate(1200)).toBeCloseTo(0.01, 10);
  });

  it("is zero for an interest free debt", () => {
    expect(monthlyRate(0)).toBe(0);
  });
});

describe("outstandingBalance", () => {
  it("is the principal less what has been paid", () => {
    expect(outstandingBalance(100_000, 40_000)).toBe(60_000);
  });

  it("never goes negative on an overpayment", () => {
    expect(outstandingBalance(100_000, 120_000)).toBe(0);
  });

  it("grows when fresh borrowing is recorded as a negative payment", () => {
    expect(outstandingBalance(100_000, -20_000)).toBe(120_000);
  });
});

describe("payoffPercentage", () => {
  it("reports the cleared share", () => {
    expect(payoffPercentage(25_000, 100_000)).toBe(25);
  });

  it("guards against a non-positive principal", () => {
    expect(payoffPercentage(500, 0)).toBe(0);
  });

  it("clamps at 100, so a final oversized payment cannot read past cleared", () => {
    expect(payoffPercentage(120_000, 100_000)).toBe(100);
  });
});

describe("scheduleDefaultsForDebt", () => {
  const bikeLoan = {
    name: "Bike Loan",
    balance: 176_000,
    aprBasisPoints: 1700,
    minimumPayment: 12_000,
  };

  it("names the schedule the way a logged payment names its transaction", () => {
    expect(scheduleDefaultsForDebt(bikeLoan).payee).toBe("Debt: Bike Loan");
  });

  it("signs the amount as money leaving the account", () => {
    expect(scheduleDefaultsForDebt(bikeLoan).amount).toBe(-12_000);
  });

  it("repeats monthly, matching what minimumPayment already means", () => {
    expect(scheduleDefaultsForDebt(bikeLoan)).toMatchObject({
      frequency: "monthly",
      interval: 1,
    });
  });

  it("ends the schedule at the projected payoff", () => {
    const today = new Date("2026-08-29T00:00:00.000Z");
    const defaults = scheduleDefaultsForDebt(bikeLoan, today);

    expect(defaults.endDate).toEqual(
      projectedPayoffDate(176_000, 1700, 12_000, today)
    );
  });

  it("leaves the end date open when the payment never clears the debt", () => {
    const stalled = { ...bikeLoan, minimumPayment: 100 };

    expect(scheduleDefaultsForDebt(stalled).endDate).toBeNull();
  });
});

describe("monthlyInterest", () => {
  it("charges the monthly rate on the balance", () => {
    expect(monthlyInterest(100_000, 1200)).toBeCloseTo(1000, 6);
  });

  it("does not charge interest on a cleared debt", () => {
    expect(monthlyInterest(-500, 2400)).toBe(0);
  });
});

describe("monthsUntil", () => {
  it("counts forward in months", () => {
    expect(monthsUntil(utc("2026-07-01"), utc("2026-01-01"))).toBeCloseTo(6, 0);
  });

  it("goes negative once the date has passed", () => {
    expect(monthsUntil(utc("2025-12-01"), utc("2026-01-01"))).toBeLessThan(0);
  });
});

describe("monthsToPayoff", () => {
  it("is a plain division with no interest", () => {
    expect(monthsToPayoff(120_000, 0, 10_000)).toBe(12);
  });

  it("takes longer once interest is charged", () => {
    const months = monthsToPayoff(120_000, 1800, 10_000);

    expect(months).not.toBeNull();
    expect(months!).toBeGreaterThan(12);
    expect(months!).toBeLessThan(14);
  });

  it("is zero when there is nothing left to pay", () => {
    expect(monthsToPayoff(0, 1800, 10_000)).toBe(0);
  });

  it("never pays off on an interest-only payment", () => {
    expect(monthsToPayoff(120_000, 1800, 1800)).toBeNull();
  });

  it("never pays off without a payment", () => {
    expect(monthsToPayoff(120_000, 1800, 0)).toBeNull();
  });
});

describe("totalInterest", () => {
  it("is nothing on an interest free debt", () => {
    expect(totalInterest(120_000, 0, 10_000)).toBe(0);
  });

  it("is the payments made less the balance cleared", () => {
    const interest = totalInterest(120_000, 1800, 10_000);

    expect(interest).not.toBeNull();
    expect(interest!).toBeGreaterThan(0);
  });

  it("is null when the debt never clears", () => {
    expect(totalInterest(120_000, 1800, 1000)).toBeNull();
  });
});

describe("projectedPayoffDate", () => {
  it("lands roughly a year out on a twelve month payoff", () => {
    const date = projectedPayoffDate(120_000, 0, 10_000, utc("2026-01-01"));

    expect(date).not.toBeNull();
    expect(date!.getUTCFullYear()).toBe(2027);
    expect(date!.getUTCMonth()).toBe(0);
  });

  it("is today when the debt is already cleared", () => {
    const today = utc("2026-01-01");

    expect(projectedPayoffDate(0, 1800, 10_000, today)).toEqual(today);
  });

  it("is null when the payment cannot clear the debt", () => {
    expect(
      projectedPayoffDate(120_000, 1800, 1000, utc("2026-01-01"))
    ).toBeNull();
  });
});

describe("requiredPayment", () => {
  it("splits an interest free balance evenly", () => {
    expect(requiredPayment(120_000, 0, 12)).toBe(10_000);
  });

  it("asks for more once interest is charged", () => {
    expect(requiredPayment(120_000, 1800, 12)).toBeGreaterThan(10_000);
  });

  it("clears the balance in the months it is given", () => {
    const payment = requiredPayment(120_000, 1800, 12);

    expect(monthsToPayoff(120_000, 1800, payment)).toBeCloseTo(12, 6);
  });

  it("asks for the whole balance when the deadline has gone", () => {
    expect(requiredPayment(120_000, 1800, -2)).toBe(120_000);
  });

  it("asks for nothing on a cleared debt", () => {
    expect(requiredPayment(0, 1800, 12)).toBe(0);
  });
});

describe("debtStatus", () => {
  const deadline = utc("2027-01-01");
  const today = utc("2026-01-01");

  it("is cleared once the balance is gone", () => {
    expect(debtStatus(0, 1800, 10_000, deadline, today)).toBe("cleared");
  });

  it("is stalled when the minimum does not cover the interest", () => {
    expect(debtStatus(120_000, 1800, 1000, deadline, today)).toBe("stalled");
  });

  it("has no deadline to judge against without a target date", () => {
    expect(debtStatus(120_000, 1800, 20_000, null, today)).toBe("no-deadline");
  });

  it("is ahead when the payoff lands well before the target", () => {
    expect(debtStatus(120_000, 1800, 30_000, deadline, today)).toBe("ahead");
  });

  it("is behind when the payoff overshoots the target", () => {
    expect(debtStatus(120_000, 1800, 6000, deadline, today)).toBe("behind");
  });

  it("is on track when the payoff lands about on the target", () => {
    const payment = requiredPayment(120_000, 1800, 12);

    expect(debtStatus(120_000, 1800, payment, deadline, today)).toBe(
      "on-track"
    );
  });
});

describe("orderDebts", () => {
  const debts = [
    { id: "a", balance: 90_000, aprBasisPoints: 2400 },
    { id: "b", balance: 20_000, aprBasisPoints: 600 },
    { id: "c", balance: 50_000, aprBasisPoints: 1200 },
  ];

  it("takes the smallest balance first on a snowball", () => {
    expect(orderDebts(debts, "snowball").map((d) => d.id)).toEqual([
      "b",
      "c",
      "a",
    ]);
  });

  it("takes the highest rate first on an avalanche", () => {
    expect(orderDebts(debts, "avalanche").map((d) => d.id)).toEqual([
      "a",
      "c",
      "b",
    ]);
  });

  it("leaves the input untouched", () => {
    orderDebts(debts, "snowball");

    expect(debts[0]!.id).toBe("a");
  });

  it("breaks a balance tie on the rate", () => {
    const tied = [
      { id: "low", balance: 10_000, aprBasisPoints: 500 },
      { id: "high", balance: 10_000, aprBasisPoints: 2500 },
    ];

    expect(orderDebts(tied, "snowball").map((d) => d.id)).toEqual([
      "high",
      "low",
    ]);
  });
});

describe("simulatePayoff", () => {
  const debts = [
    {
      id: "card",
      name: "Credit card",
      balance: 60_000,
      aprBasisPoints: 2400,
      minimumPayment: 3000,
    },
    {
      id: "loan",
      name: "Car loan",
      balance: 20_000,
      aprBasisPoints: 600,
      minimumPayment: 2000,
    },
  ];

  it("clears everything and reports when each debt went", () => {
    const plan = simulatePayoff(debts, 0, "snowball");

    expect(plan.clearedAll).toBe(true);
    expect(plan.months).toBeGreaterThan(0);

    for (const entry of plan.order) {
      expect(entry.monthsToClear).not.toBeNull();
      expect(entry.monthsToClear!).toBeLessThanOrEqual(plan.months);
    }
  });

  it("rolls a cleared minimum into the next debt", () => {
    const plan = simulatePayoff(debts, 0, "snowball");
    const [first, second] = plan.order;

    expect(first!.id).toBe("loan");
    expect(plan.months).toBeLessThan(
      Math.ceil(monthsToPayoff(60_000, 2400, 3000)!)
    );
    expect(second!.id).toBe("card");
  });

  it("finishes sooner with more money in the budget", () => {
    const lean = simulatePayoff(debts, 0, "snowball");
    const generous = simulatePayoff(debts, 10_000, "snowball");

    expect(generous.months).toBeLessThan(lean.months);
    expect(generous.totalInterest).toBeLessThan(lean.totalInterest);
  });

  it("pays out the balance plus the interest it charged", () => {
    const plan = simulatePayoff(debts, 5000, "avalanche");
    const principal = debts.reduce((total, d) => total + d.balance, 0);

    expect(plan.totalPaid).toBeCloseTo(principal + plan.totalInterest, 4);
  });

  it("gives up rather than looping forever on a hopeless budget", () => {
    const hopeless = simulatePayoff(
      [
        {
          id: "card",
          name: "Credit card",
          balance: 100_000,
          aprBasisPoints: 3600,
          minimumPayment: 100,
        },
      ],
      0,
      "avalanche"
    );

    expect(hopeless.clearedAll).toBe(false);
    expect(hopeless.months).toBe(MAX_PROJECTION_MONTHS);
    expect(hopeless.order[0]!.monthsToClear).toBeNull();
  });

  it("has nothing to do without any debts", () => {
    const plan = simulatePayoff([], 5000, "snowball");

    expect(plan.months).toBe(0);
    expect(plan.clearedAll).toBe(true);
    expect(plan.totalPaid).toBe(0);
  });
});

describe("comparePayoffStrategies", () => {
  const debts = [
    {
      id: "card",
      name: "Store card",
      balance: 80_000,
      aprBasisPoints: 3600,
      minimumPayment: 2500,
    },
    {
      id: "loan",
      name: "Small loan",
      balance: 15_000,
      aprBasisPoints: 400,
      minimumPayment: 1500,
    },
  ];

  it("recommends the avalanche when it saves real interest", () => {
    const comparison = comparePayoffStrategies(debts, 5000);

    expect(comparison.recommended).toBe("avalanche");
    expect(comparison.interestSaved).toBeGreaterThan(0);
  });

  it("recommends the snowball when the two tie", () => {
    const identical = [
      {
        id: "a",
        name: "A",
        balance: 20_000,
        aprBasisPoints: 1200,
        minimumPayment: 2000,
      },
      {
        id: "b",
        name: "B",
        balance: 20_000,
        aprBasisPoints: 1200,
        minimumPayment: 2000,
      },
    ];

    expect(comparePayoffStrategies(identical, 0).recommended).toBe("snowball");
  });

  it("reports both plans against the same budget", () => {
    const comparison = comparePayoffStrategies(debts, 5000);

    expect(comparison.snowball.strategy).toBe("snowball");
    expect(comparison.avalanche.strategy).toBe("avalanche");
    expect(comparison.monthsSaved).toBe(
      comparison.snowball.months - comparison.avalanche.months
    );
  });
});
