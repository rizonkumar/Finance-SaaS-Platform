import { afterEach, describe, expect, it } from "vitest";

import {
  currencySymbol,
  DEFAULT_CURRENCY_CODE,
  findCurrency,
  formatMoney,
  getActiveCurrency,
  setActiveCurrency,
} from "@/lib/currency";

afterEach(() => setActiveCurrency(DEFAULT_CURRENCY_CODE));

describe("findCurrency", () => {
  it("falls back to the default for an unknown code", () => {
    expect(findCurrency("XYZ").code).toBe(DEFAULT_CURRENCY_CODE);
  });
});

describe("active currency", () => {
  it("formats with the chosen currency", () => {
    setActiveCurrency("USD");

    expect(getActiveCurrency().code).toBe("USD");
    expect(formatMoney(1234.5)).toBe("$1,234.50");
    expect(currencySymbol()).toBe("$");
  });

  it("uses Indian grouping by default", () => {
    expect(formatMoney(123456.78)).toBe("₹1,23,456.78");
  });
});
