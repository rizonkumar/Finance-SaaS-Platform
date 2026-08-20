import { describe, expect, it } from "vitest";

import {
  budgetAttention,
  buildAttentionItems,
  debtAttention,
  goalAttention,
} from "@/lib/attention";

describe("budgetAttention", () => {
  it("is silent when the budget is on track", () => {
    expect(
      budgetAttention({
        id: "b1",
        category: "Food",
        status: "on-track",
        percentage: 40,
      })
    ).toBeNull();
  });

  it("flags a warning as a warning severity", () => {
    const item = budgetAttention({
      id: "b1",
      category: "Food",
      status: "warning",
      percentage: 82,
    });

    expect(item).toEqual({
      id: "budget-b1",
      kind: "budget",
      severity: "warning",
      title: "Food",
      reason: "82% of budget spent, close to the limit",
      href: "/budgets",
    });
  });

  it("flags an overspend as critical", () => {
    const item = budgetAttention({
      id: "b2",
      category: null,
      status: "over",
      percentage: 143,
    });

    expect(item?.severity).toBe("critical");
    expect(item?.title).toBe("Overall spending");
    expect(item?.reason).toBe("143% of budget spent");
  });
});

describe("goalAttention", () => {
  it("is silent unless the goal is behind pace", () => {
    for (const status of [
      "completed",
      "ahead",
      "on-track",
      "no-deadline",
    ] as const) {
      expect(
        goalAttention({
          id: "g1",
          name: "Emergency fund",
          status,
          percentage: 50,
        })
      ).toBeNull();
    }
  });

  it("flags a behind-pace goal as a warning", () => {
    const item = goalAttention({
      id: "g1",
      name: "Emergency fund",
      status: "behind",
      percentage: 31.4,
    });

    expect(item).toEqual({
      id: "goal-g1",
      kind: "goal",
      severity: "warning",
      title: "Emergency fund",
      reason: "31% funded, behind pace",
      href: "/goals",
    });
  });
});

describe("debtAttention", () => {
  it("is silent unless the debt is behind or stalled", () => {
    for (const status of [
      "cleared",
      "ahead",
      "on-track",
      "no-deadline",
    ] as const) {
      expect(
        debtAttention({ id: "d1", name: "Car loan", status, percentage: 20 })
      ).toBeNull();
    }
  });

  it("flags a stalled debt as critical, independent of its percentage", () => {
    const item = debtAttention({
      id: "d1",
      name: "Car loan",
      status: "stalled",
      percentage: 0,
    });

    expect(item).toEqual({
      id: "debt-d1",
      kind: "debt",
      severity: "critical",
      title: "Car loan",
      reason: "The payment does not cover the interest",
      href: "/debts",
    });
  });

  it("flags a behind-pace debt as a warning", () => {
    const item = debtAttention({
      id: "d2",
      name: "Credit card",
      status: "behind",
      percentage: 12.9,
    });

    expect(item).toEqual({
      id: "debt-d2",
      kind: "debt",
      severity: "warning",
      title: "Credit card",
      reason: "13% cleared, behind pace",
      href: "/debts",
    });
  });
});

describe("buildAttentionItems", () => {
  it("is empty with nothing to flag", () => {
    expect(buildAttentionItems({ budgets: [], goals: [], debts: [] })).toEqual(
      []
    );
  });

  it("puts every critical item ahead of every warning item", () => {
    const items = buildAttentionItems({
      budgets: [
        { id: "b1", category: "Rent", status: "warning", percentage: 80 },
      ],
      goals: [{ id: "g1", name: "Trip", status: "behind", percentage: 10 }],
      debts: [
        { id: "d1", name: "Card", status: "stalled", percentage: 0 },
        { id: "d2", name: "Loan", status: "behind", percentage: 40 },
      ],
    });

    expect(items.map((item) => item.severity)).toEqual([
      "critical",
      "warning",
      "warning",
      "warning",
    ]);
    expect(items[0]?.id).toBe("debt-d1");
  });

  it("keeps the relative order stable within the same severity", () => {
    const items = buildAttentionItems({
      budgets: [
        { id: "b1", category: "Rent", status: "over", percentage: 110 },
      ],
      goals: [],
      debts: [{ id: "d1", name: "Card", status: "stalled", percentage: 0 }],
    });

    expect(items.map((item) => item.id)).toEqual(["budget-b1", "debt-d1"]);
  });
});
