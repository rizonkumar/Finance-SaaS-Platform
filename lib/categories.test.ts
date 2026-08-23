import { describe, expect, it } from "vitest";
import { Film, Plane, Repeat, Shapes, Utensils, Wifi } from "lucide-react";

import { getCategoryMeta } from "@/lib/categories";

describe("getCategoryMeta", () => {
  it("matches food keywords to Utensils", () => {
    expect(getCategoryMeta("Food").icon).toBe(Utensils);
    expect(getCategoryMeta("Groceries").icon).toBe(Utensils);
    expect(getCategoryMeta("Restaurant Dining").icon).toBe(Utensils);
  });

  it("matches travel keywords to Plane", () => {
    expect(getCategoryMeta("Travel").icon).toBe(Plane);
    expect(getCategoryMeta("Flight Tickets").icon).toBe(Plane);
  });

  it("matches movie keywords to Film", () => {
    expect(getCategoryMeta("Movie").icon).toBe(Film);
    expect(getCategoryMeta("Cinema").icon).toBe(Film);
  });

  it("matches wifi keywords to Wifi", () => {
    expect(getCategoryMeta("WiFi Bill").icon).toBe(Wifi);
    expect(getCategoryMeta("Internet").icon).toBe(Wifi);
  });

  it("matches subscription keywords to Repeat", () => {
    expect(getCategoryMeta("Subscriptions").icon).toBe(Repeat);
    expect(getCategoryMeta("SaaS").icon).toBe(Repeat);
  });

  it("falls back to Shapes for unknown category names", () => {
    expect(getCategoryMeta("Miscellaneous Unknown 123").icon).toBe(Shapes);
  });
});
