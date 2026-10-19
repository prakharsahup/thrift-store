import { conditions, type ProductCondition } from "@/lib/config/conditions";
import type {
  Bucket,
  Dimension,
  InsightsParams,
  Kpis,
  RangePreset,
  ageBuckets,
} from "@/lib/validators/insights";

// Pure helpers for /admin/insights: turning URL params into an India-time date range, the
// ratios derived from the raw sums the database returns, and labels for the keys it groups by.

// ---------------------------------------------------------------------------
// Date ranges (the store runs on India time)
// ---------------------------------------------------------------------------

const MAX_RANGE_DAYS = 731;

const istDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" });

/** "2026-10-19": the date in India at `now`. */
export function istToday(now: Date): string {
  return istDate.format(now);
}

/** Midnight at the start of an India-time date. */
function istMidnight(date: string): Date {
  return new Date(`${date}T00:00:00+05:30`);
}

/** "2026-10-19" plus `days` (negative goes back). */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
}

export type ResolvedRange = {
  preset: RangePreset;
  /** Start of the first day, India time. */
  from: Date;
  /** End of the range: now for ranges ending today, else midnight after the last day. */
  to: Date;
  /** First and last day, for date inputs. */
  fromDate: string;
  toDate: string;
  /** Days covered, counting both ends. */
  days: number;
  bucket: Bucket;
  label: string;
};

const presetDays = { "7d": 7, "30d": 30, "90d": 90, "12m": 365 } as const;

export const presetLabels: Record<RangePreset, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "12m": "Last 12 months",
  ytd: "This year",
  custom: "Custom",
};

const shortDate = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const longDate = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** "3 Oct" or "3 Oct 2026" for a "2026-10-03" date. */
export function formatDay(date: string, withYear = false): string {
  return (withYear ? longDate : shortDate).format(new Date(`${date}T00:00:00Z`));
}

/**
 * The range a page shows. Presets end now, so "last 30 days" compares like-for-like with the 30
 * days before it; a custom range covers whole days and is capped at two years.
 */
export function resolveRange(params: InsightsParams, now = new Date()): ResolvedRange {
  const today = istToday(now);
  let preset: RangePreset = params.range ?? (params.from && params.to ? "custom" : "30d");
  if (preset === "custom" && !(params.from && params.to)) preset = "30d";

  let fromDate: string;
  let toDate = today;
  if (preset === "custom" && params.from && params.to) {
    const [a, b] = [params.from, params.to].sort();
    toDate = b > today ? today : b;
    fromDate = a > toDate ? toDate : a;
    if (daysBetween(fromDate, toDate) >= MAX_RANGE_DAYS)
      fromDate = addDays(toDate, 1 - MAX_RANGE_DAYS);
  } else if (preset === "ytd") {
    fromDate = `${today.slice(0, 4)}-01-01`;
  } else {
    fromDate = addDays(today, 1 - presetDays[preset as keyof typeof presetDays]);
  }

  const days = daysBetween(fromDate, toDate) + 1;
  const bucket: Bucket =
    params.bucket && !(params.bucket === "day" && days > MAX_RANGE_DAYS)
      ? params.bucket
      : days <= 45
        ? "day"
        : days <= 200
          ? "week"
          : "month";

  return {
    preset,
    from: istMidnight(fromDate),
    to: toDate === today ? now : istMidnight(addDays(toDate, 1)),
    fromDate,
    toDate,
    days,
    bucket,
    label:
      preset === "custom"
        ? `${formatDay(fromDate, fromDate.slice(0, 4) !== toDate.slice(0, 4))} – ${formatDay(toDate, true)}`
        : presetLabels[preset],
  };
}

/** "vs the 30 days before" */
export function comparisonLabel(range: ResolvedRange): string {
  return range.days === 1 ? "vs the day before" : `vs the ${range.days} days before`;
}

// ---------------------------------------------------------------------------
// Derived metrics
// ---------------------------------------------------------------------------

function ratio(part: number, whole: number): number | null {
  return whole > 0 ? part / whole : null;
}

/** The headline numbers, from the raw sums insights_summary returns. All money is in paise. */
export function deriveKpis(k: Kpis) {
  // Pieces sold to someone else first are refunded, so they never count as revenue.
  const revenuePaise = k.gross_paise - k.unavailable_paise;
  const profitPaise = k.costed_revenue_paise - k.cost_paise;
  return {
    revenuePaise,
    orders: k.orders,
    avgOrderPaise: k.orders > 0 ? Math.round(revenuePaise / k.orders) : null,
    itemsSold: k.items_sold,
    /** Over the pieces that have a cost; see costCoverage. */
    profitPaise: k.costed_items > 0 ? profitPaise : null,
    margin: ratio(profitPaise, k.costed_revenue_paise),
    /** Share of sold pieces with a cost entered. */
    costCoverage: ratio(k.costed_items, k.items_sold),
    discountPaise: k.discount_paise,
    shippingPaise: k.shipping_paise,
    refundedOrders: k.refunded_orders,
    refundedPaise: k.refunded_paise,
    buyers: k.buyers,
    newBuyers: k.new_buyers,
    returningBuyers: k.buyers - k.new_buyers,
    /** Checkouts started in the range that were paid. */
    conversion: ratio(k.checkouts_paid, k.checkouts),
  };
}

export type DerivedKpis = ReturnType<typeof deriveKpis>;

/** Relative change from previous to current, or null when there's nothing to compare against. */
export function change(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) return null;
  return (current - previous) / Math.abs(previous);
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const percent0 = new Intl.NumberFormat("en-IN", { style: "percent", maximumFractionDigits: 0 });
const percent1 = new Intl.NumberFormat("en-IN", { style: "percent", maximumFractionDigits: 1 });
const compactMoney = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 1,
});
const compactNumber = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** 0.123 → "12%" (or "12.3%" with precise). */
export function formatPercent(fraction: number, precise = false): string {
  return (precise ? percent1 : percent0).format(fraction);
}

/** 0.123 → "+12%", -0.05 → "−5%". */
export function formatChange(fraction: number): string {
  const text = percent0.format(Math.abs(fraction));
  return fraction > 0 ? `+${text}` : fraction < 0 ? `−${text}` : text;
}

/** Axis labels: 1250000 paise → "₹12.5K". */
export function formatMoneyCompact(paise: number): string {
  return compactMoney.format(paise / 100);
}

export function formatCount(n: number): string {
  return n >= 10_000 ? compactNumber.format(n) : n.toLocaleString("en-IN");
}

/** 18.4 → "18 h", 60 → "2.5 days". */
export function formatHours(hours: number): string {
  if (hours < 48) return `${Math.round(hours)} h`;
  const days = hours / 24;
  return `${days < 10 ? days.toFixed(1).replace(/\.0$/, "") : Math.round(days)} days`;
}

// ---------------------------------------------------------------------------
// Labels for the keys reports group by
// ---------------------------------------------------------------------------

export const dimensionLabels: Record<Dimension, string> = {
  category: "Category",
  brand: "Brand",
  style: "Style",
  condition: "Condition",
  size: "Tagged size",
  gender: "For",
  price_band: "Price",
  drop: "Drop",
  state: "State",
  city: "City",
  payment_method: "Payment method",
};

const priceBandLabels: Record<string, string> = {
  under_150: "Under ₹150",
  "150_299": "₹150–299",
  "300_499": "₹300–499",
  "500_999": "₹500–999",
  "1000_plus": "₹1,000+",
};

/** Price bands in price order, for sorting. */
export const priceBandOrder = Object.keys(priceBandLabels);

export const ageBucketLabels: Record<(typeof ageBuckets)[number], string> = {
  "0_14": "Under 2 weeks",
  "15_30": "2–4 weeks",
  "31_60": "1–2 months",
  "61_plus": "Over 2 months",
};

const genderLabels: Record<string, string> = { men: "Men", women: "Women", unisex: "Unisex" };

const paymentLabels: Record<string, string> = {
  upi: "UPI",
  card: "Card",
  netbanking: "Netbanking",
  wallet: "Wallet",
  emi: "EMI",
  unknown: "Not recorded",
};

/** How a breakdown key reads on screen, e.g. ("price_band", "150_299") → "₹150–299". */
export function keyLabel(dimension: Dimension, key: string): string {
  switch (dimension) {
    case "price_band":
      return priceBandLabels[key] ?? key;
    case "condition":
      return key in conditions ? conditions[key as ProductCondition].label : key;
    case "gender":
      return genderLabels[key] ?? key;
    case "payment_method":
      return paymentLabels[key] ?? key;
    case "style":
      return key === "untagged" ? "No style tag" : key;
    default:
      return key;
  }
}

// ---------------------------------------------------------------------------
// Links and charts
// ---------------------------------------------------------------------------

/**
 * A link to an insights page that keeps the current range (and demo mode), with some params
 * changed or removed (null).
 */
export function insightsHref(
  path: string,
  params: Record<string, string>,
  changes: Record<string, string | null> = {},
): string {
  const next = new URLSearchParams(params);
  for (const [key, value] of Object.entries(changes)) {
    if (value === null) next.delete(key);
    else next.set(key, value);
  }
  const query = next.toString();
  return query ? `${path}?${query}` : path;
}

/** A round axis maximum at or above `max`: 1234 → 1500, 0 → 1. */
export function niceMax(max: number): number {
  if (max <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((s) => s * magnitude >= max) ?? 10;
  return step * magnitude;
}

/** Axis label for a bucket start: "3 Oct" for days and weeks, "Oct 26" for months. */
export function bucketLabel(bucket: string, size: Bucket): string {
  if (size !== "month") return formatDay(bucket);
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${bucket}T00:00:00Z`));
}

/** Sold ÷ (sold + still listed): how much of what was on offer found a buyer. */
export function sellThrough(sold: number, listedNow: number | null): number | null {
  if (listedNow === null) return null;
  return ratio(sold, sold + listedNow);
}
