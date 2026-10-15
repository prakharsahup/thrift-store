// All money in this app is an integer smallest-unit amount (cents for USD, paise for a legacy
// INR row). Format only at render time with formatMoney().

const wholeDollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const withCents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

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

export type Currency = "USD" | "INR";

/**
 * Formats an integer smallest-unit amount at render time: 49900 → "$499", 49950 → "$499.50".
 * The store prices everything in USD, so `currency` defaults to "USD" — pass "INR" explicitly
 * only for a product still carrying a legacy INR value in its `currency` column.
 */
export function formatMoney(amount: number, currency: Currency = "USD"): string {
  if (!Number.isInteger(amount)) {
    throw new Error(`formatMoney expects an integer smallest-unit amount, received ${amount}`);
  }
  if (currency === "INR") {
    const rupees = amount / 100;
    return amount % 100 === 0 ? wholeRupees.format(rupees) : withPaise.format(rupees);
  }
  const dollars = amount / 100;
  return amount % 100 === 0 ? wholeDollars.format(dollars) : withCents.format(dollars);
}

/** Converts a dollar amount (e.g. from an admin form) to integer cents. */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/** Percentage saved versus the estimated retail price, rounded down. */
export function savingPercent(pricePaise: number, originalPricePaise: number): number {
  if (originalPricePaise <= pricePaise) return 0;
  return Math.floor(((originalPricePaise - pricePaise) / originalPricePaise) * 100);
}
