// Where we ship, and the currency each country browses in (owner decision, 2026-10-24).
//
// Best-effort list, to confirm with the courier once one is chosen: countries that let a parcel of
// used clothing in for a private buyer. Left out on purpose:
// - blanket bans on used-clothing imports: China, Indonesia, Vietnam, the Philippines, Algeria,
//   Bolivia, Ecuador, Paraguay, Sudan (Library of Congress survey, 2024)
// - restricted or permit-only: Brazil, Peru, Mexico, South Africa, Turkey, Bangladesh, the East
//   African Community
// - no post or trade with India, or sanctioned: Pakistan, Russia, Belarus, Iran, North Korea,
//   Syria, Cuba, Myanmar, Afghanistan
// Every listed currency needs a rate in lib/config/currency.ts.
export const shippingCountries = [
  { code: "IN", name: "India", currency: "INR" },
  // North America
  { code: "US", name: "United States", currency: "USD" },
  { code: "CA", name: "Canada", currency: "CAD" },
  // Europe
  { code: "GB", name: "United Kingdom", currency: "GBP" },
  { code: "IE", name: "Ireland", currency: "EUR" },
  { code: "AT", name: "Austria", currency: "EUR" },
  { code: "BE", name: "Belgium", currency: "EUR" },
  { code: "BG", name: "Bulgaria", currency: "EUR" },
  { code: "HR", name: "Croatia", currency: "EUR" },
  { code: "CY", name: "Cyprus", currency: "EUR" },
  { code: "CZ", name: "Czechia", currency: "CZK" },
  { code: "DK", name: "Denmark", currency: "DKK" },
  { code: "EE", name: "Estonia", currency: "EUR" },
  { code: "FI", name: "Finland", currency: "EUR" },
  { code: "FR", name: "France", currency: "EUR" },
  { code: "DE", name: "Germany", currency: "EUR" },
  { code: "GR", name: "Greece", currency: "EUR" },
  { code: "HU", name: "Hungary", currency: "HUF" },
  { code: "IS", name: "Iceland", currency: "ISK" },
  { code: "IT", name: "Italy", currency: "EUR" },
  { code: "LV", name: "Latvia", currency: "EUR" },
  { code: "LT", name: "Lithuania", currency: "EUR" },
  { code: "LU", name: "Luxembourg", currency: "EUR" },
  { code: "MT", name: "Malta", currency: "EUR" },
  { code: "NL", name: "Netherlands", currency: "EUR" },
  { code: "NO", name: "Norway", currency: "NOK" },
  { code: "PL", name: "Poland", currency: "PLN" },
  { code: "PT", name: "Portugal", currency: "EUR" },
  { code: "RO", name: "Romania", currency: "RON" },
  { code: "SK", name: "Slovakia", currency: "EUR" },
  { code: "SI", name: "Slovenia", currency: "EUR" },
  { code: "ES", name: "Spain", currency: "EUR" },
  { code: "SE", name: "Sweden", currency: "SEK" },
  { code: "CH", name: "Switzerland", currency: "CHF" },
  // Asia-Pacific
  { code: "AU", name: "Australia", currency: "AUD" },
  { code: "NZ", name: "New Zealand", currency: "NZD" },
  { code: "JP", name: "Japan", currency: "JPY" },
  { code: "KR", name: "South Korea", currency: "KRW" },
  { code: "SG", name: "Singapore", currency: "SGD" },
  { code: "MY", name: "Malaysia", currency: "MYR" },
  { code: "HK", name: "Hong Kong", currency: "HKD" },
  { code: "NP", name: "Nepal", currency: "NPR" },
  // Middle East
  { code: "AE", name: "United Arab Emirates", currency: "AED" },
  { code: "SA", name: "Saudi Arabia", currency: "SAR" },
  { code: "QA", name: "Qatar", currency: "QAR" },
  { code: "KW", name: "Kuwait", currency: "KWD" },
  { code: "BH", name: "Bahrain", currency: "BHD" },
  { code: "OM", name: "Oman", currency: "OMR" },
  { code: "IL", name: "Israel", currency: "ILS" },
] as const;

export type ShippingCountry = (typeof shippingCountries)[number];
export type CountryCode = ShippingCountry["code"];

export const countryCodes = shippingCountries.map((c) => c.code) as [CountryCode, ...CountryCode[]];

/** The shipping country for an ISO code, or undefined if we don't ship there. */
export function findCountry(code: string | null | undefined): ShippingCountry | undefined {
  return shippingCountries.find((c) => c.code === code);
}

/** "IN" → "India". Falls back to the code itself for countries we no longer ship to. */
export function countryName(code: string): string {
  return findCountry(code)?.name ?? code;
}
