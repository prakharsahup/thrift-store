// Single source of truth for the shipping rule (owner decision, 2026-10-24). Flat rates, no
// free-shipping threshold. The courier isn't chosen yet.
export const shipping = {
  domesticPaise: 20000, // ₹200 anywhere in India
  internationalUsdCents: 4000, // US$40 to every other country in lib/config/countries.ts
} as const;

/**
 * Shipping charge in paise to a destination country. International shipping is priced in US
 * dollars but charged in rupees, at `usdPerRupee` (the day's rate), rounded up to a whole rupee.
 */
export function shippingFor(country: string, usdPerRupee: number): number {
  if (country === "IN") return shipping.domesticPaise;
  return Math.ceil(shipping.internationalUsdCents / usdPerRupee / 100) * 100;
}

/** "US$40", for policy text. */
export const internationalShippingLabel = `US$${shipping.internationalUsdCents / 100}`;
