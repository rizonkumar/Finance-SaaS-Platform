export const CURRENCY_CODES = [
  "INR",
  "USD",
  "EUR",
  "GBP",
  "AUD",
  "CAD",
  "SGD",
  "AED",
] as const;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export type Currency = {
  code: CurrencyCode;
  locale: string;
  label: string;
};

const CURRENCY_DETAILS: Record<CurrencyCode, Omit<Currency, "code">> = {
  INR: { locale: "en-IN", label: "Indian rupee" },
  USD: { locale: "en-US", label: "US dollar" },
  EUR: { locale: "en-IE", label: "Euro" },
  GBP: { locale: "en-GB", label: "British pound" },
  AUD: { locale: "en-AU", label: "Australian dollar" },
  CAD: { locale: "en-CA", label: "Canadian dollar" },
  SGD: { locale: "en-SG", label: "Singapore dollar" },
  AED: { locale: "en-AE", label: "UAE dirham" },
};

export const DEFAULT_CURRENCY_CODE: CurrencyCode = "INR";

const isCurrencyCode = (code: string): code is CurrencyCode =>
  (CURRENCY_CODES as readonly string[]).includes(code);

export const findCurrency = (code: string): Currency => {
  const resolved = isCurrencyCode(code) ? code : DEFAULT_CURRENCY_CODE;

  return { code: resolved, ...CURRENCY_DETAILS[resolved] };
};

export const CURRENCY_OPTIONS = CURRENCY_CODES.map((code) => ({
  value: code,
  label: `${code} · ${CURRENCY_DETAILS[code].label}`,
}));

let activeCurrency = findCurrency(DEFAULT_CURRENCY_CODE);

export const getActiveCurrency = () => activeCurrency;

export function setActiveCurrency(code: string) {
  activeCurrency = findCurrency(code);
}

export function formatMoney(value: number, currency = activeCurrency) {
  return Intl.NumberFormat(currency.locale, {
    style: "currency",
    currency: currency.code,
    minimumFractionDigits: 2,
  }).format(value);
}

export function currencySymbol(currency = activeCurrency) {
  return (
    Intl.NumberFormat(currency.locale, {
      style: "currency",
      currency: currency.code,
    })
      .formatToParts(0)
      .find((part) => part.type === "currency")?.value ?? currency.code
  );
}
