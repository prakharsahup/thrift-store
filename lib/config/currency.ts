import { findCountry, type ShippingCountry } from "./countries";

// Display currencies. Prices are stored and charged in rupees; visitors abroad see them converted
// into their own currency as an estimate (owner decision, 2026-10-24). Rates come from
// lib/server/rates.ts.

export type DisplayCurrency = ShippingCountry["currency"];

/** Units of each currency per ₹1 (USD: 0.0105 means ₹1 = $0.0105). */
export type ExchangeRates = Record<DisplayCurrency, number>;

/** Currencies with a daily market rate from the rates feed (ECB reference rates). */
export const marketCurrencies = [
  "USD",
  "CAD",
  "GBP",
  "EUR",
  "CZK",
  "DKK",
  "HUF",
  "ISK",
  "NOK",
  "PLN",
  "RON",
  "SEK",
  "CHF",
  "AUD",
  "NZD",
  "JPY",
  "KRW",
  "SGD",
  "MYR",
  "HKD",
  "ILS",
] as const satisfies readonly DisplayCurrency[];

/** Gulf currencies pegged to the US dollar: units per $1 (Kuwait's basket peg is approximate). */
export const usdPegs = {
  AED: 3.6725,
  SAR: 3.75,
  QAR: 3.64,
  KWD: 0.307,
  BHD: 0.376,
  OMR: 0.3845,
} as const satisfies Partial<Record<DisplayCurrency, number>>;

/** The Nepalese rupee is pegged to the Indian rupee: NPR 1.6 per ₹1. */
export const nprPerRupee = 1.6;

/** Used when the rates feed can't be reached (ECB rates for 23 October 2026). */
export const fallbackMarketRates: Record<(typeof marketCurrencies)[number], number> = {
  USD: 0.01053,
  CAD: 0.01474,
  GBP: 0.00788,
  EUR: 0.00941,
  CZK: 0.22892,
  DKK: 0.07034,
  HUF: 3.4509,
  ISK: 1.2816,
  NOK: 0.09849,
  PLN: 0.04135,
  RON: 0.05034,
  SEK: 0.10474,
  CHF: 0.00868,
  AUD: 0.015,
  NZD: 0.01852,
  JPY: 1.6515,
  KRW: 13.9499,
  SGD: 0.01347,
  MYR: 0.04303,
  HKD: 0.08261,
  ILS: 0.03288,
};

/** The full rate table from market rates (missing ones fall back), plus the pegged currencies. */
export function buildRates(market: Partial<Record<string, number>>): ExchangeRates {
  const rates = Object.fromEntries(
    marketCurrencies.map((c) => [c, market[c] ?? fallbackMarketRates[c]]),
  ) as Record<(typeof marketCurrencies)[number], number>;
  return {
    ...rates,
    INR: 1,
    NPR: nprPerRupee,
    AED: usdPegs.AED * rates.USD,
    SAR: usdPegs.SAR * rates.USD,
    QAR: usdPegs.QAR * rates.USD,
    KWD: usdPegs.KWD * rates.USD,
    BHD: usdPegs.BHD * rates.USD,
    OMR: usdPegs.OMR * rates.USD,
  };
}

export const fallbackRates: ExchangeRates = buildRates({});

/**
 * The currency a visitor browses in, from their country: India or unknown → INR, a country we
 * ship to → its own currency, anywhere else → USD.
 */
export function currencyForCountry(country: string | null): DisplayCurrency {
  if (!country) return "INR";
  return findCountry(country)?.currency ?? "USD";
}
