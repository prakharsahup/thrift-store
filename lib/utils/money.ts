// All money in this app is integer paise (₹499 = 49900). Format only at render time.

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

/** Formats integer paise as Indian rupees: 49900 → "₹499", 49950 → "₹499.50". */
export function formatINR(paise: number): string {
  if (!Number.isInteger(paise)) {
    throw new Error(`formatINR expects integer paise, received ${paise}`);
  }
  const rupees = paise / 100;
  return paise % 100 === 0 ? wholeRupees.format(rupees) : withPaise.format(rupees);
}

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

/**
 * Formats a product's price in its own currency. Vendoo-imported items are priced in USD
 * (price_paise still holds the smallest unit — cents, here) pending repricing to INR; everything
 * else is INR. Use this instead of formatINR wherever a product's `currency` column is in scope.
 */
export function formatMoney(amount: number, currency: "INR" | "USD"): string {
  if (!Number.isInteger(amount)) {
    throw new Error(`formatMoney expects an integer smallest-unit amount, received ${amount}`);
  }
  if (currency === "USD") {
    const dollars = amount / 100;
    return amount % 100 === 0 ? wholeDollars.format(dollars) : withCents.format(dollars);
  }
  return formatINR(amount);
}

/** Converts a rupee amount (e.g. from an admin form) to integer paise. */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/** Percentage saved versus the estimated retail price, rounded down. */
export function savingPercent(pricePaise: number, originalPricePaise: number): number {
  if (originalPricePaise <= pricePaise) return 0;
  return Math.floor(((originalPricePaise - pricePaise) / originalPricePaise) * 100);
}
