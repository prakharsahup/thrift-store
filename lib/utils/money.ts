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
 * Every price on the site is shown in rupees (owner decision, 2026-10-16), whatever a product's
 * legacy `currency` column says.
 */
export function formatMoney(amount: number): string {
  if (!Number.isInteger(amount)) {
    throw new Error(`formatMoney expects an integer paise amount, received ${amount}`);
  }
  const rupees = amount / 100;
  return amount % 100 === 0 ? wholeRupees.format(rupees) : withPaise.format(rupees);
}

/** Converts a rupee amount (e.g. from an admin form) to integer paise. */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}
