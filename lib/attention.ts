import type { BudgetStatus } from "@/lib/budgets";
import type { DebtStatus } from "@/lib/debts";
import type { GoalStatus } from "@/lib/goals";

export type AttentionSeverity = "critical" | "warning";
export type AttentionKind = "budget" | "goal" | "debt";

export type AttentionItem = {
  id: string;
  kind: AttentionKind;
  severity: AttentionSeverity;
  title: string;
  reason: string;
  href: string;
};

type BudgetInput = {
  id: string;
  category: string | null;
  status: BudgetStatus;
  percentage: number;
};

type GoalInput = {
  id: string;
  name: string;
  status: GoalStatus;
  percentage: number;
};

type DebtInput = {
  id: string;
  name: string;
  status: DebtStatus;
  percentage: number;
};

export function budgetAttention(budget: BudgetInput): AttentionItem | null {
  if (budget.status === "on-track") return null;

  return {
    id: `budget-${budget.id}`,
    kind: "budget",
    severity: budget.status === "over" ? "critical" : "warning",
    title: budget.category ?? "Overall spending",
    reason:
      budget.status === "over"
        ? `${Math.round(budget.percentage)}% of budget spent`
        : `${Math.round(budget.percentage)}% of budget spent, close to the limit`,
    href: "/budgets",
  };
}

export function goalAttention(goal: GoalInput): AttentionItem | null {
  if (goal.status !== "behind") return null;

  return {
    id: `goal-${goal.id}`,
    kind: "goal",
    severity: "warning",
    title: goal.name,
    reason: `${Math.round(goal.percentage)}% funded, behind pace`,
    href: "/goals",
  };
}

export function debtAttention(debt: DebtInput): AttentionItem | null {
  if (debt.status === "stalled") {
    return {
      id: `debt-${debt.id}`,
      kind: "debt",
      severity: "critical",
      title: debt.name,
      reason: "The payment does not cover the interest",
      href: "/debts",
    };
  }

  if (debt.status === "behind") {
    return {
      id: `debt-${debt.id}`,
      kind: "debt",
      severity: "warning",
      title: debt.name,
      reason: `${Math.round(debt.percentage)}% cleared, behind pace`,
      href: "/debts",
    };
  }

  return null;
}

const SEVERITY_RANK: Record<AttentionSeverity, number> = {
  critical: 0,
  warning: 1,
};

export function buildAttentionItems(input: {
  budgets: BudgetInput[];
  goals: GoalInput[];
  debts: DebtInput[];
}): AttentionItem[] {
  const items = [
    ...input.budgets.map(budgetAttention),
    ...input.goals.map(goalAttention),
    ...input.debts.map(debtAttention),
  ].filter((item): item is AttentionItem => item !== null);

  return items.sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
  );
}
