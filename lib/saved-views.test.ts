import { describe, expect, it } from "vitest";

import {
  describeViewQuery,
  parsePeriodDays,
  resolveViewQuery,
  sanitizeViewQuery,
  sidebarViews,
  viewHref,
  RECENT_VIEWS_LIMIT,
} from "@/lib/saved-views";

const today = new Date(2026, 9, 18, 9);

describe("sanitizeViewQuery", () => {
  it("keeps only the filters a view can restore", () => {
    expect(sanitizeViewQuery("?from=2026-01-01&utm=x&accountId=a1")).toBe(
      "from=2026-01-01&accountId=a1"
    );
  });

  it("drops empty values", () => {
    expect(sanitizeViewQuery("from=&to=")).toBe("");
  });
});

describe("parsePeriodDays", () => {
  it("reads a rolling period in days", () => {
    expect(parsePeriodDays("7d")).toBe(7);
  });

  it("ignores anything else", () => {
    expect(parsePeriodDays("week")).toBeNull();
    expect(parsePeriodDays(null)).toBeNull();
  });
});

describe("resolveViewQuery", () => {
  it("turns a rolling period into dates ending today", () => {
    expect(resolveViewQuery("period=7d&accountId=a1", today)).toBe(
      "accountId=a1&from=2026-10-11&to=2026-10-18"
    );
  });

  it("leaves fixed dates untouched", () => {
    expect(resolveViewQuery("from=2026-01-01&to=2026-01-31", today)).toBe(
      "from=2026-01-01&to=2026-01-31"
    );
  });
});

describe("viewHref", () => {
  it("returns the bare route when there are no filters", () => {
    expect(viewHref({ route: "/budgets", query: "" }, today)).toBe("/budgets");
  });

  it("appends the resolved filters", () => {
    expect(viewHref({ route: "/reports", query: "period=1d" }, today)).toBe(
      "/reports?from=2026-10-17&to=2026-10-18"
    );
  });
});

describe("describeViewQuery", () => {
  it("describes rolling, fixed and default periods", () => {
    expect(describeViewQuery("period=30d")).toBe("Last 30 days");
    expect(describeViewQuery("from=2026-01-01&to=2026-01-31")).toBe(
      "2026-01-01 to 2026-01-31"
    );
    expect(describeViewQuery("accountId=a1")).toBe(
      "Default period · One account"
    );
  });
});

describe("sidebarViews", () => {
  const view = (
    id: string,
    isPinned: boolean,
    lastOpenedAt: string | null
  ) => ({
    id,
    route: "/",
    query: "",
    isPinned,
    lastOpenedAt,
  });

  it("separates pinned views from recently opened ones", () => {
    const { pinned, recent } = sidebarViews([
      view("pinned", true, "2026-10-01"),
      view("old", false, "2026-09-01"),
      view("new", false, "2026-10-10"),
      view("never", false, null),
    ]);

    expect(pinned.map((item) => item.id)).toEqual(["pinned"]);
    expect(recent.map((item) => item.id)).toEqual(["new", "old"]);
  });

  it("caps the recent list", () => {
    const views = Array.from({ length: RECENT_VIEWS_LIMIT + 3 }, (_v, index) =>
      view(
        String(index),
        false,
        `2026-10-${String(index + 1).padStart(2, "0")}`
      )
    );

    expect(sidebarViews(views).recent).toHaveLength(RECENT_VIEWS_LIMIT);
  });
});
