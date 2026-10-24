// All money in this app is an integer number of paise (₹499 = 49900). Format only at render time
// with formatMoney().

const wholeRupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const withPaise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formats an integer paise amount at render time: 49900 → "₹499", 49950 → "₹499.50".
 * Prices are stored and charged in rupees. On the storefront, shoppers browsing from abroad see
 * converted prices instead (<Price> in components/currency, using formatConverted below).
 */
export function formatMoney(amount: number): string {
  if (!Number.isInteger(amount)) {
    throw new Error(`formatMoney expects an integer paise amount, received ${amount}`);
  }
  const rupees = amount / 100;
  return amount % 100 === 0 ? wholeRupees.format(rupees) : withPaise.format(rupees);
}

const converted = new Map<string, Intl.NumberFormat>();

/**
 * Formats a paise amount converted into another currency at `rate` units per ₹1:
 * (49900, "USD", 0.0105) → "$5.24". Display only: orders are always charged in rupees.
 * Uses each currency's usual decimals (none for JPY, three for KWD).
 */
export function formatConverted(amountPaise: number, currency: string, rate: number): string {
  if (currency === "INR") return formatMoney(amountPaise);
  let format = converted.get(currency);
  if (!format) {
    format = new Intl.NumberFormat("en", { style: "currency", currency });
    converted.set(currency, format);
  }
  return format.format((amountPaise / 100) * rate);
}

/**
 * What a USD-charged order actually cost the buyer (orders.charge_currency/charge_amount), e.g.
 * "US$52.60" — or null for an ordinary rupee order, whose *_paise amounts already say it.
 */
export function formatUsdCharge(order: {
  charge_currency: string;
  charge_amount: number | null;
}): string | null {
  if (order.charge_currency !== "USD" || !order.charge_amount) return null;
  return `US${formatConverted(order.charge_amount, "USD", 1)}`;
}

/** Converts a rupee amount (e.g. from an admin form) to integer paise. */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}
