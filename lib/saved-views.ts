import { format, subDays } from "date-fns";

import { DATE_FORMAT } from "@/lib/constants";

export const VIEW_PARAMS = ["from", "to", "accountId", "period"] as const;

export const RECENT_VIEWS_LIMIT = 5;
export const MAX_SAVED_VIEWS = 100;

export const VIEW_EMOJIS = [
  "📌",
  "🧾",
  "🎯",
  "🔁",
  "🌊",
  "🏔️",
  "📊",
  "💡",
  "🛒",
  "✈️",
  "🏠",
  "💳",
] as const;

const PERIOD_PATTERN = /^(\d{1,3})d$/;

export type ViewTemplate = {
  key: string;
  name: string;
  emoji: string;
  route: string;
  query: string;
  description: string;
};

export const VIEW_TEMPLATES: readonly ViewTemplate[] = [
  {
    key: "weekly-spending",
    name: "Weekly spending summary",
    emoji: "🧾",
    route: "/reports",
    query: "period=7d",
    description: "Income, spending and top payees over the last seven days.",
  },
  {
    key: "monthly-budget",
    name: "Monthly budget review",
    emoji: "🎯",
    route: "/budgets",
    query: "",
    description: "Every limit and how much of it this period has used.",
  },
  {
    key: "subscription-audit",
    name: "Subscription audit",
    emoji: "🔁",
    route: "/recurring",
    query: "",
    description: "Everything that charges you on a schedule, in one list.",
  },
  {
    key: "cashflow-check",
    name: "Cashflow health check",
    emoji: "🌊",
    route: "/forecast",
    query: "",
    description: "Where balances land after the next month of bills.",
  },
  {
    key: "debt-progress",
    name: "Debt payoff progress",
    emoji: "🏔️",
    route: "/debts",
    query: "",
    description: "What is left to clear and when each debt ends.",
  },
];

export type SavedViewLike = {
  id: string;
  route: string;
  query: string;
  isPinned: boolean;
  lastOpenedAt: string | Date | null;
};

export function sanitizeViewQuery(search: string): string {
  const source = new URLSearchParams(search);
  const kept = new URLSearchParams();

  for (const key of VIEW_PARAMS) {
    const value = source.get(key);

    if (value) kept.set(key, value);
  }

  return kept.toString();
}

export const parsePeriodDays = (period: string | null) => {
  const days = period ? PERIOD_PATTERN.exec(period)?.[1] : undefined;

  return days ? Number(days) : null;
};

export function resolveViewQuery(query: string, today: Date = new Date()) {
  const params = new URLSearchParams(query);
  const days = parsePeriodDays(params.get("period"));

  params.delete("period");

  if (days !== null) {
    params.set("from", format(subDays(today, days), DATE_FORMAT));
    params.set("to", format(today, DATE_FORMAT));
  }

  return params.toString();
}

export function viewHref(
  view: Pick<SavedViewLike, "route" | "query">,
  today: Date = new Date()
) {
  const query = resolveViewQuery(view.query, today);

  return query ? `${view.route}?${query}` : view.route;
}

function describePeriod(params: URLSearchParams) {
  const days = parsePeriodDays(params.get("period"));
  const from = params.get("from");
  const to = params.get("to");

  if (days !== null) return `Last ${days} days`;
  if (from && to) return `${from} to ${to}`;

  return "Default period";
}

export function describeViewQuery(query: string) {
  const params = new URLSearchParams(query);
  const period = describePeriod(params);

  return params.get("accountId") ? `${period} · One account` : period;
}

const openedAt = (view: SavedViewLike) =>
  view.lastOpenedAt ? new Date(view.lastOpenedAt).getTime() : 0;

export function sidebarViews<T extends SavedViewLike>(views: T[]) {
  return {
    pinned: views.filter((view) => view.isPinned),
    recent: views
      .filter((view) => !view.isPinned && view.lastOpenedAt)
      .sort((a, b) => openedAt(b) - openedAt(a))
      .slice(0, RECENT_VIEWS_LIMIT),
  };
}
