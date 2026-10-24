import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/server/auth";
import { addDays, istToday, resolveRange, type ResolvedRange } from "@/lib/utils/insights";
import {
  breakdownSchema,
  customersSchema,
  fulfilmentSchema,
  funnelSchema,
  heatmapSchema,
  insightsParamsSchema,
  inventorySchema,
  marketingSchema,
  productDimensions,
  summarySchema,
  timeseriesSchema,
  type Dimension,
} from "@/lib/validators/insights";

// Reads for /admin/insights. This used to be nine SECURITY DEFINER Postgres functions
// (20261019172116_insights_reports.sql, ~1000 lines of jsonb_build_object trees with no tests and
// no way to step through them). The raw data now comes from two plain views —
// public.insights_orders / public.insights_items (20261020020000_insights_views.sql), readable
// only by service_role, the same "RLS can't hide rows, privileges can" pattern CLAUDE.md §7 already
// uses — and every report below is typed, diffable TypeScript instead. Every result is still
// parsed with the zod schemas in lib/validators/insights.ts, so a shape mismatch fails loudly
// here instead of rendering wrong numbers.
//
// The old SQL functions are untouched and still callable; this file no longer calls them. Compare
// a few numbers on /admin/insights (old vs new build) before they're dropped for good.

type AdminClient = Awaited<ReturnType<typeof requireAdmin>>["supabase"];

export type InsightsContext = {
  supabase: AdminClient;
  range: ResolvedRange;
  /** Showing generated demo data rather than real orders. */
  demo: boolean;
  /** The raw params, for building links that keep the current range. */
  params: Record<string, string>;
};

/**
 * Checks the admin role, works out the date range from the URL, and (in demo mode) makes sure
 * the demo data is fresh. Call once per page, then pass the context to the readers below.
 */
export async function getInsightsContext(
  searchParams: Record<string, string | string[] | undefined>,
): Promise<InsightsContext> {
  const { supabase } = await requireAdmin();
  const parsed = insightsParamsSchema.parse(searchParams);
  if (parsed.demo) {
    const { error } = await supabase.rpc("insights_prepare_demo");
    if (error) throw new Error(`insights demo data: ${error.message}`);
  }
  const range = resolveRange(parsed);
  const params: Record<string, string> = { range: range.preset };
  if (range.preset === "custom") Object.assign(params, { from: range.fromDate, to: range.toDate });
  if (parsed.bucket) params.bucket = parsed.bucket;
  if (parsed.demo) params.demo = "1";
  return { supabase, range, demo: parsed.demo, params };
}

// ---------------------------------------------------------------------------
// Raw data, loaded once per request and shared by every report (React cache()).
// ---------------------------------------------------------------------------

type OrderStatus =
  "pending" | "paid" | "packed" | "shipped" | "delivered" | "cancelled" | "refunded";

type OrderRow = {
  id: string;
  user_id: string | null;
  customer_email: string | null;
  status: OrderStatus;
  subtotal_paise: number;
  shipping_paise: number;
  discount_paise: number;
  total_paise: number;
  coupon_code: string | null;
  address: Record<string, unknown> | null;
  payment_method: string | null;
  created_at: string;
  paid_at: string | null;
  packed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
};

type ItemRow = {
  order_id: string;
  product_id: string;
  price_paise: number;
  unavailable: boolean;
  listed_at: string | null;
  cost_paise: number | null;
  brand: string | null;
  condition: string;
  tagged_size: string | null;
  gender: string;
  style_tags: string[];
  drop_id: string | null;
  category_id: string | null;
  original_price_paise: number | null;
  /** The product's price today, not at sale time — see the view's own comment. Only price_band
   * bucketing uses this; everything else uses the price-at-sale `price_paise` above. */
  product_price_paise: number;
};

/** Every order for this demo flag, real or generated — the full history, not range-filtered: a
 * handful of reports (lifetime buyer counts, "all-time" drop performance) need it regardless of
 * the page's selected range, so it's simplest to load once and filter in memory everywhere. */
const loadOrders = cache(async (demo: boolean): Promise<OrderRow[]> => {
  const { data, error } = await createAdminClient()
    .from("insights_orders")
    .select(
      "id, user_id, customer_email, status, subtotal_paise, shipping_paise, discount_paise, " +
        "total_paise, coupon_code, address, payment_method, created_at, paid_at, packed_at, " +
        "shipped_at, delivered_at",
    )
    .eq("demo", demo);
  if (error) throw new Error(`insights_orders: ${error.message}`);
  // supabase-js can't narrow a view's select() to its Row type without Relationships metadata
  // (falls back to a generic error type); the columns above are exactly OrderRow's fields.
  return (data ?? []) as unknown as OrderRow[];
});

const loadItems = cache(async (demo: boolean): Promise<ItemRow[]> => {
  const { data, error } = await createAdminClient()
    .from("insights_items")
    .select(
      "order_id, product_id, price_paise, unavailable, listed_at, cost_paise, brand, condition, " +
        "tagged_size, gender, style_tags, drop_id, category_id, original_price_paise, " +
        "product_price_paise",
    )
    .eq("demo", demo);
  if (error) throw new Error(`insights_items: ${error.message}`);
  // Same supabase-js limitation as loadOrders above.
  return (data ?? []) as unknown as ItemRow[];
});

type LiveProductRow = {
  id: string;
  brand: string | null;
  condition: string;
  tagged_size: string | null;
  gender: string;
  style_tags: string[];
  drop_id: string | null;
  category_id: string | null;
  price_paise: number;
};

/** Every piece currently available or reserved — for breakdown's "listed_now" sell-through. */
const loadLiveProducts = cache(async (): Promise<LiveProductRow[]> => {
  const { data, error } = await createAdminClient()
    .from("products")
    .select(
      "id, brand, condition, tagged_size, gender, style_tags, drop_id, category_id, price_paise",
    )
    .in("status", ["available", "reserved"]);
  if (error) throw new Error(`products (live): ${error.message}`);
  return data ?? [];
});

/** category_id -> "Parent › Child" (or just "Child" for a top-level category). */
const loadCategoryNames = cache(async (): Promise<Map<string, string>> => {
  const { data, error } = await createAdminClient()
    .from("categories")
    .select("id, name, parent_id");
  if (error) throw new Error(`categories: ${error.message}`);
  const byId = new Map((data ?? []).map((c) => [c.id, c]));
  return new Map(
    (data ?? []).map((c) => {
      const parent = c.parent_id ? byId.get(c.parent_id) : null;
      return [c.id, parent ? `${parent.name} › ${c.name}` : c.name];
    }),
  );
});

/** drop_id -> name. */
const loadDropNames = cache(async (): Promise<Map<string, string>> => {
  const { data, error } = await createAdminClient().from("drops").select("id, name");
  if (error) throw new Error(`drops: ${error.message}`);
  return new Map((data ?? []).map((d) => [d.id, d.name]));
});

// ---------------------------------------------------------------------------
// Shared predicates and small arithmetic helpers
// ---------------------------------------------------------------------------

const SALE_STATUSES = new Set<OrderStatus>(["paid", "packed", "shipped", "delivered"]);
/** Ever paid, refunds included — "lifetime" buyer stats and the funnel's "paid" count use this. */
const EVER_PAID_STATUSES = new Set<OrderStatus>([
  "paid",
  "packed",
  "shipped",
  "delivered",
  "refunded",
]);

function inRange(iso: string | null, from: Date, to: Date): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= from.getTime() && t < to.getTime();
}

/** A sale (CLAUDE.md's definition, repeated in every report that touches revenue): paid in range,
 * refunds reported separately, cancellations never count. */
function isSale(o: OrderRow, from: Date, to: Date): boolean {
  return SALE_STATUSES.has(o.status) && inRange(o.paid_at, from, to);
}

function sum<T>(rows: T[], pick: (r: T) => number | null): number {
  return rows.reduce((total, r) => total + (pick(r) ?? 0), 0);
}

function round(n: number | null, places: number): number | null {
  if (n === null || !Number.isFinite(n)) return null;
  const f = 10 ** places;
  return Math.round(n * f) / f;
}

/** Postgres `percentile_cont(p)`: linear interpolation over the sorted, non-null values. */
function percentileCont(sortedAsc: number[], p: number): number | null {
  const n = sortedAsc.length;
  if (n === 0) return null;
  const rank = p * (n - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  if (lo === hi) return sortedAsc[lo];
  return sortedAsc[lo] + (sortedAsc[hi] - sortedAsc[lo]) * (rank - lo);
}

const maskEmail = (email: string) => email.replace(/^(.{1,2})[^@]*(@.*)?$/, "$1•••$2");

function placeFromAddress(
  address: Record<string, unknown> | null,
  field: "state" | "city",
): string {
  const raw = typeof address?.[field] === "string" ? (address[field] as string).trim() : "";
  if (!raw) return "Unknown";
  return raw.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
}

// ---------------------------------------------------------------------------
// Date bucketing (day / week-from-Monday / month), India calendar time
// ---------------------------------------------------------------------------

/** The Monday on or before an India-calendar "YYYY-MM-DD" date. */
function truncWeek(ymd: string): string {
  const isoDow = new Date(`${ymd}T00:00:00Z`).getUTCDay() || 7; // Sun (0) -> 7
  return addDays(ymd, -(isoDow - 1));
}

function truncMonth(ymd: string): string {
  return `${ymd.slice(0, 7)}-01`;
}

function stepMonth(ymd: string, by: number): string {
  const [y, m] = ymd.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

function truncBucket(ymd: string, bucket: "day" | "week" | "month"): string {
  return bucket === "week" ? truncWeek(ymd) : bucket === "month" ? truncMonth(ymd) : ymd;
}

function stepBucket(ymd: string, bucket: "day" | "week" | "month"): string {
  return bucket === "day"
    ? addDays(ymd, 1)
    : bucket === "week"
      ? addDays(ymd, 7)
      : stepMonth(ymd, 1);
}

/** Every bucket start in [from, to), India calendar time — mirrors `generate_series` in the old
 * insights_timeseries: the last bucket is the one containing `to - 1 second`. */
function bucketStarts(from: Date, to: Date, bucket: "day" | "week" | "month"): string[] {
  const first = truncBucket(istToday(from), bucket);
  const last = truncBucket(istToday(new Date(to.getTime() - 1000)), bucket);
  const out: string[] = [];
  for (let b = first; b <= last; b = stepBucket(b, bucket)) out.push(b);
  return out;
}

// ---------------------------------------------------------------------------
// Summary KPIs (was private.kpis / public.insights_summary)
// ---------------------------------------------------------------------------

function kpis(orders: OrderRow[], items: ItemRow[], from: Date, to: Date) {
  const sales = orders.filter((o) => isSale(o, from, to));
  const saleIds = new Set(sales.map((s) => s.id));
  const saleItems = items.filter((i) => saleIds.has(i.order_id));
  const available = saleItems.filter((i) => !i.unavailable);
  const unavailable = saleItems.filter((i) => i.unavailable);
  const costed = available.filter((i) => i.cost_paise !== null);

  const firstPaidByUser = new Map<string, number>();
  for (const o of orders) {
    if (!o.user_id || !o.paid_at || !EVER_PAID_STATUSES.has(o.status)) continue;
    const t = new Date(o.paid_at).getTime();
    const prev = firstPaidByUser.get(o.user_id);
    if (prev === undefined || t < prev) firstPaidByUser.set(o.user_id, t);
  }
  const buyerIds = new Set(sales.flatMap((s) => (s.user_id ? [s.user_id] : [])));
  const newBuyers = [...buyerIds].filter((id) => {
    const t = firstPaidByUser.get(id);
    return t !== undefined && t >= from.getTime();
  });

  const refunded = orders.filter((o) => o.status === "refunded" && inRange(o.paid_at, from, to));
  const checkouts = orders.filter((o) => inRange(o.created_at, from, to));
  const checkoutsPaid = checkouts.filter((o) => o.paid_at !== null);

  return {
    orders: sales.length,
    gross_paise: sum(sales, (s) => s.total_paise),
    discount_paise: sum(sales, (s) => s.discount_paise),
    shipping_paise: sum(sales, (s) => s.shipping_paise),
    items_sold: available.length,
    merchandise_paise: sum(available, (i) => i.price_paise),
    unavailable_items: unavailable.length,
    unavailable_paise: sum(unavailable, (i) => i.price_paise),
    costed_items: costed.length,
    costed_revenue_paise: sum(costed, (i) => i.price_paise),
    cost_paise: sum(available, (i) => i.cost_paise),
    buyers: buyerIds.size,
    new_buyers: newBuyers.length,
    refunded_orders: refunded.length,
    refunded_paise: sum(refunded, (o) => o.total_paise),
    checkouts: checkouts.length,
    checkouts_paid: checkoutsPaid.length,
  };
}

export async function getSummary(ctx: InsightsContext) {
  const [orders, items] = await Promise.all([loadOrders(ctx.demo), loadItems(ctx.demo)]);
  const { from, to } = ctx.range;
  const span = to.getTime() - from.getTime();
  const previousFrom = new Date(from.getTime() - span);
  return summarySchema.parse({
    current: kpis(orders, items, from, to),
    previous: kpis(orders, items, previousFrom, from),
  });
}

// ---------------------------------------------------------------------------
// Sales over time (was public.insights_timeseries)
// ---------------------------------------------------------------------------

export async function getTimeseries(ctx: InsightsContext, { previous = false } = {}) {
  const [orders, items] = await Promise.all([loadOrders(ctx.demo), loadItems(ctx.demo)]);
  const { from: rangeFrom, to: rangeTo, bucket } = ctx.range;
  const span = rangeTo.getTime() - rangeFrom.getTime();
  const from = previous ? new Date(rangeFrom.getTime() - span) : rangeFrom;
  const to = previous ? rangeFrom : rangeTo;

  const sales = orders.filter((o) => isSale(o, from, to));
  const byId = new Map(sales.map((s) => [s.id, s]));
  const saleItems = items.filter((i) => byId.has(i.order_id));

  const points = bucketStarts(from, to, bucket).map((start) => {
    const bucketSales = sales.filter(
      (s) => truncBucket(istToday(new Date(s.paid_at!)), bucket) === start,
    );
    const bucketSaleIds = new Set(bucketSales.map((s) => s.id));
    const bucketItems = saleItems.filter((i) => bucketSaleIds.has(i.order_id));
    const available = bucketItems.filter((i) => !i.unavailable);
    const unavailable = bucketItems.filter((i) => i.unavailable);
    const grossPaise = sum(bucketSales, (s) => s.total_paise);
    const unavailablePaise = sum(unavailable, (i) => i.price_paise);
    const profitPaise = sum(available, (i) =>
      i.cost_paise !== null ? i.price_paise - i.cost_paise : 0,
    );
    return {
      bucket: start,
      orders: bucketSales.length,
      revenue_paise: grossPaise - unavailablePaise,
      items: available.length,
      profit_paise: profitPaise,
    };
  });
  return timeseriesSchema.parse(points);
}

// ---------------------------------------------------------------------------
// Orders by weekday and hour (was public.insights_heatmap)
// ---------------------------------------------------------------------------

const hourFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  hour: "numeric",
  hourCycle: "h23",
});

export async function getHeatmap(ctx: InsightsContext) {
  const orders = await loadOrders(ctx.demo);
  const { from, to } = ctx.range;
  const sales = orders.filter((o) => isSale(o, from, to));

  const cells = new Map<
    string,
    { dow: number; hour: number; orders: number; revenue_paise: number }
  >();
  for (const s of sales) {
    const paid = new Date(s.paid_at!);
    const dow = new Date(`${istToday(paid)}T00:00:00Z`).getUTCDay() || 7;
    const hour = Number(hourFormatter.format(paid));
    const key = `${dow}:${hour}`;
    const cell = cells.get(key) ?? { dow, hour, orders: 0, revenue_paise: 0 };
    cell.orders += 1;
    cell.revenue_paise += s.total_paise;
    cells.set(key, cell);
  }
  return heatmapSchema.parse([...cells.values()]);
}

// ---------------------------------------------------------------------------
// What sells, by dimension (was public.insights_breakdown)
// ---------------------------------------------------------------------------

const PRICE_BANDS: [number, string][] = [
  [15000, "under_150"],
  [30000, "150_299"],
  [50000, "300_499"],
  [100000, "500_999"],
];
function priceBand(paise: number): string {
  for (const [max, label] of PRICE_BANDS) if (paise < max) return label;
  return "1000_plus";
}

function dimensionKeys(
  p: {
    brand: string | null;
    condition: string;
    tagged_size: string | null;
    gender: string;
    style_tags: string[];
    drop_id: string | null;
    category_id: string | null;
    /** The product's *current* price — price_band always reads this, never the sale-time price
     * (see insights_items's own comment on why those two can differ). */
    productPricePaise: number;
  },
  dimension: Dimension,
  categoryNames: Map<string, string>,
  dropNames: Map<string, string>,
): string[] {
  switch (dimension) {
    case "category":
      return [p.category_id ? (categoryNames.get(p.category_id) ?? "Unknown") : "Unknown"];
    case "brand":
      return [p.brand?.trim() || "Unbranded"];
    case "style":
      return p.style_tags.length > 0 ? p.style_tags : ["untagged"];
    case "condition":
      return [p.condition === "like_new" ? "good" : p.condition];
    case "size":
      return [p.tagged_size?.trim().toUpperCase() || "No size"];
    case "gender":
      return [p.gender];
    case "price_band":
      return [priceBand(p.productPricePaise)];
    case "drop":
      return [p.drop_id ? (dropNames.get(p.drop_id) ?? "Unknown") : "Not in a drop"];
    default:
      return ["Unknown"];
  }
}

type BreakdownAgg = {
  items_sold: number;
  orders: Set<string>;
  revenue_paise: number;
  costed_items: number;
  costed_revenue_paise: number;
  cost_paise: number;
  daysToSell: number[];
  retailRatios: number[];
};

export async function getBreakdown(ctx: InsightsContext, dimension: Dimension) {
  const isProductDim = (productDimensions as readonly string[]).includes(dimension);
  const [orders, items, categoryNames, dropNames] = await Promise.all([
    loadOrders(ctx.demo),
    loadItems(ctx.demo),
    loadCategoryNames(),
    loadDropNames(),
  ]);
  const { from, to } = ctx.range;
  const sales = orders.filter((o) => isSale(o, from, to));
  const salesById = new Map(sales.map((s) => [s.id, s]));

  const agg = new Map<string, BreakdownAgg>();
  const get = (key: string) =>
    agg.get(key) ??
    agg
      .set(key, {
        items_sold: 0,
        orders: new Set(),
        revenue_paise: 0,
        costed_items: 0,
        costed_revenue_paise: 0,
        cost_paise: 0,
        daysToSell: [],
        retailRatios: [],
      })
      .get(key)!;

  for (const i of items) {
    if (i.unavailable) continue;
    const sale = salesById.get(i.order_id);
    if (!sale) continue;
    const keys = isProductDim
      ? dimensionKeys(
          { ...i, productPricePaise: i.product_price_paise },
          dimension,
          categoryNames,
          dropNames,
        )
      : dimension === "state" || dimension === "city"
        ? [placeFromAddress(sale.address, dimension)]
        : [sale.payment_method?.trim() || "unknown"];
    for (const key of keys) {
      const a = get(key);
      a.items_sold += 1;
      a.orders.add(i.order_id);
      a.revenue_paise += i.price_paise;
      if (i.cost_paise !== null) {
        a.costed_items += 1;
        a.costed_revenue_paise += i.price_paise;
        a.cost_paise += i.cost_paise;
      }
      if (i.listed_at && sale.paid_at && new Date(sale.paid_at) > new Date(i.listed_at)) {
        a.daysToSell.push(
          (new Date(sale.paid_at).getTime() - new Date(i.listed_at).getTime()) / 86_400_000,
        );
      }
      if (i.original_price_paise !== null)
        a.retailRatios.push(i.price_paise / i.original_price_paise);
    }
  }

  const listedNow = new Map<string, number>();
  if (isProductDim) {
    const live = await loadLiveProducts();
    for (const p of live) {
      const withPrice = { ...p, productPricePaise: p.price_paise };
      for (const key of dimensionKeys(withPrice, dimension, categoryNames, dropNames)) {
        listedNow.set(key, (listedNow.get(key) ?? 0) + 1);
      }
    }
  }

  const keys = new Set([...agg.keys(), ...listedNow.keys()]);
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const rows = [...keys].map((key) => {
    const a = agg.get(key);
    return {
      key,
      items_sold: a?.items_sold ?? 0,
      orders: a?.orders.size ?? 0,
      revenue_paise: a?.revenue_paise ?? 0,
      costed_items: a?.costed_items ?? 0,
      costed_revenue_paise: a?.costed_revenue_paise ?? 0,
      cost_paise: a?.cost_paise ?? 0,
      avg_days_to_sell: round(avg(a?.daysToSell ?? []), 1),
      avg_retail_ratio: round(avg(a?.retailRatios ?? []), 3),
      listed_now: isProductDim ? (listedNow.get(key) ?? 0) : null,
    };
  });
  rows.sort(
    (x, y) =>
      y.revenue_paise - x.revenue_paise ||
      (y.listed_now ?? 0) - (x.listed_now ?? 0) ||
      x.key.localeCompare(y.key),
  );
  return breakdownSchema.parse(rows);
}

// ---------------------------------------------------------------------------
// Stock on hand (was public.insights_inventory)
// ---------------------------------------------------------------------------

export async function getInventory(ctx: InsightsContext) {
  const admin = createAdminClient();
  const [
    { data: live, error: liveError },
    { count: draftCount, error: draftError },
    { data: costs, error: costError },
  ] = await Promise.all([
    admin
      .from("products")
      .select("id, slug, title, brand, price_paise, published_at, created_at")
      .in("status", ["available", "reserved"]),
    admin.from("products").select("id", { count: "exact", head: true }).eq("status", "draft"),
    // Demo mode shows demo costs against the same real products, same as every other report —
    // the "live" stock itself never has a demo version.
    admin.from("insights_costs").select("product_id, cost_paise").eq("demo", ctx.demo),
  ]);
  if (liveError) throw new Error(`products (inventory): ${liveError.message}`);
  if (draftError) throw new Error(`products (draft count): ${draftError.message}`);
  if (costError) throw new Error(`insights_costs: ${costError.message}`);

  const costByProduct = new Map((costs ?? []).map((c) => [c.product_id, c.cost_paise]));
  const now = Date.now();
  const rows = (live ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    brand: p.brand,
    price_paise: p.price_paise,
    cost_paise: costByProduct.get(p.id) ?? null,
    days_listed: Math.max(
      0,
      Math.floor((now - new Date(p.published_at ?? p.created_at).getTime()) / 86_400_000),
    ),
  }));

  const ages = ["0_14", "15_30", "31_60", "61_plus"] as const;
  const ageBucket = (days: number) =>
    days <= 14 ? "0_14" : days <= 30 ? "15_30" : days <= 60 ? "31_60" : "61_plus";

  let imagesByProduct = new Map<string, string>();
  const oldestCandidates = [...rows].sort(
    (a, b) => b.days_listed - a.days_listed || a.title.localeCompare(b.title),
  );
  const oldest25 = oldestCandidates.slice(0, 25);
  if (oldest25.length) {
    const { data: images, error: imageError } = await admin
      .from("product_images")
      .select("product_id, url, sort_order")
      .in(
        "product_id",
        oldest25.map((p) => p.id),
      )
      .order("sort_order");
    if (imageError) throw new Error(`product_images: ${imageError.message}`);
    imagesByProduct = new Map();
    for (const img of images ?? [])
      if (!imagesByProduct.has(img.product_id)) imagesByProduct.set(img.product_id, img.url);
  }

  return inventorySchema.parse({
    live_count: rows.length,
    list_value_paise: sum(rows, (r) => r.price_paise),
    costed_count: rows.filter((r) => r.cost_paise !== null).length,
    cost_paise: sum(rows, (r) => r.cost_paise),
    draft_count: draftCount ?? 0,
    ages: ages.map((bucket) => {
      const inBucket = rows.filter((r) => ageBucket(r.days_listed) === bucket);
      return { bucket, count: inBucket.length, value_paise: sum(inBucket, (r) => r.price_paise) };
    }),
    oldest: oldest25.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      brand: p.brand,
      price_paise: p.price_paise,
      days_listed: p.days_listed,
      image_url: imagesByProduct.get(p.id) ?? null,
    })),
  });
}

// ---------------------------------------------------------------------------
// Customers (was public.insights_customers)
// ---------------------------------------------------------------------------

export async function getCustomers(ctx: InsightsContext) {
  const orders = await loadOrders(ctx.demo);
  const { from, to } = ctx.range;
  const sales = orders.filter((o) => isSale(o, from, to));

  const lifetime = new Map<string, { orders: number; firstPaidAt: number }>();
  for (const o of orders) {
    if (!o.user_id || !o.paid_at || !EVER_PAID_STATUSES.has(o.status)) continue;
    const t = new Date(o.paid_at).getTime();
    const l = lifetime.get(o.user_id) ?? { orders: 0, firstPaidAt: Infinity };
    l.orders += 1;
    l.firstPaidAt = Math.min(l.firstPaidAt, t);
    lifetime.set(o.user_id, l);
  }

  const perBuyer = new Map<string, { email: string | null; orders: number; spent_paise: number }>();
  for (const s of sales) {
    if (!s.user_id) continue;
    const b = perBuyer.get(s.user_id) ?? { email: null, orders: 0, spent_paise: 0 };
    b.email = s.customer_email ?? b.email;
    b.orders += 1;
    b.spent_paise += s.total_paise;
    perBuyer.set(s.user_id, b);
  }

  const newBuyers = [...perBuyer.entries()].filter(
    ([id]) => (lifetime.get(id)?.firstPaidAt ?? Infinity) >= from.getTime(),
  );
  const ordersFromReturning = sales.filter((s) => {
    const l = s.user_id ? lifetime.get(s.user_id) : undefined;
    return l && s.paid_at && l.firstPaidAt < new Date(s.paid_at).getTime();
  });

  const topBuyers = [...perBuyer.values()]
    .sort((a, b) => b.spent_paise - a.spent_paise)
    .slice(0, 10)
    .map((b) => ({
      email: maskEmail(b.email ?? "unknown"),
      orders: b.orders,
      spent_paise: b.spent_paise,
    }));

  const places = sales.map((s) => ({
    state: placeFromAddress(s.address, "state"),
    city: placeFromAddress(s.address, "city"),
    total_paise: s.total_paise,
  }));
  const topPlaces = (field: "state" | "city") => {
    const by = new Map<string, { orders: number; revenue_paise: number }>();
    for (const p of places) {
      const key = p[field];
      const row = by.get(key) ?? { orders: 0, revenue_paise: 0 };
      row.orders += 1;
      row.revenue_paise += p.total_paise;
      by.set(key, row);
    }
    return [...by.entries()]
      .sort(([, a], [, b]) => b.orders - a.orders || b.revenue_paise - a.revenue_paise)
      .slice(0, 10)
      .map(([key, row]) => ({ key, orders: row.orders, revenue_paise: row.revenue_paise }));
  };

  return customersSchema.parse({
    buyers: perBuyer.size,
    new_buyers: newBuyers.length,
    orders_from_returning: ordersFromReturning.length,
    lifetime_buyers: lifetime.size,
    lifetime_repeat_buyers: [...lifetime.values()].filter((l) => l.orders >= 2).length,
    top_buyers: topBuyers,
    states: topPlaces("state"),
    cities: topPlaces("city"),
  });
}

// ---------------------------------------------------------------------------
// Checkout funnel (was public.insights_funnel)
// ---------------------------------------------------------------------------

export async function getFunnel(ctx: InsightsContext) {
  const [orders, items] = await Promise.all([loadOrders(ctx.demo), loadItems(ctx.demo)]);
  const { from, to } = ctx.range;
  const started = orders.filter((o) => inRange(o.created_at, from, to));
  const startedIds = new Set(started.map((o) => o.id));

  return funnelSchema.parse({
    started: started.length,
    paid: started.filter((o) => EVER_PAID_STATUSES.has(o.status)).length,
    pending: started.filter((o) => o.status === "pending").length,
    abandoned: started.filter((o) => o.status === "cancelled" && !o.paid_at).length,
    late_payments: started.filter((o) => o.status === "cancelled" && o.paid_at).length,
    refunded: started.filter((o) => o.status === "refunded").length,
    pieces_lost: items.filter((i) => i.unavailable && startedIds.has(i.order_id)).length,
  });
}

// ---------------------------------------------------------------------------
// Coupons and drops (was public.insights_marketing)
// ---------------------------------------------------------------------------

export async function getMarketing(ctx: InsightsContext) {
  const [orders, items] = await Promise.all([loadOrders(ctx.demo), loadItems(ctx.demo)]);
  const { from, to } = ctx.range;
  const sales = orders.filter((o) => isSale(o, from, to));
  // Drop performance is reported across the drop's entire life, not just this range.
  const allSales = orders.filter((o) => SALE_STATUSES.has(o.status) && o.paid_at);
  const allSalesById = new Map(allSales.map((s) => [s.id, s]));

  const admin = createAdminClient();
  const [
    { data: coupons, error: couponError },
    { data: drops, error: dropError },
    { data: notifies, error: notifyError },
  ] = await Promise.all([
    admin.from("coupons").select("code, type, value"),
    admin
      .from("drops")
      .select("id, name, slug, go_live_at")
      .eq("is_published", true)
      .gte("go_live_at", from.toISOString())
      .lt("go_live_at", to.toISOString()),
    admin
      .from("notify_requests")
      .select("drop_id")
      .not("confirmed_at", "is", null)
      .not("drop_id", "is", null),
  ]);
  if (couponError) throw new Error(`coupons: ${couponError.message}`);
  if (dropError) throw new Error(`drops: ${dropError.message}`);
  if (notifyError) throw new Error(`notify_requests: ${notifyError.message}`);

  const couponsByCode = new Map((coupons ?? []).map((c) => [c.code, c]));
  const couponUsage = new Map<
    string,
    { uses: number; discount_paise: number; revenue_paise: number }
  >();
  for (const s of sales) {
    if (!s.coupon_code) continue;
    const row = couponUsage.get(s.coupon_code) ?? { uses: 0, discount_paise: 0, revenue_paise: 0 };
    row.uses += 1;
    row.discount_paise += s.discount_paise;
    row.revenue_paise += s.total_paise;
    couponUsage.set(s.coupon_code, row);
  }

  const notifyCountByDrop = new Map<string, number>();
  for (const n of notifies ?? []) {
    if (!n.drop_id) continue;
    notifyCountByDrop.set(n.drop_id, (notifyCountByDrop.get(n.drop_id) ?? 0) + 1);
  }

  let productCounts: { drop_id: string | null }[] = [];
  if (drops?.length) {
    const { data, error } = await admin
      .from("products")
      .select("drop_id")
      .in(
        "drop_id",
        drops.map((d) => d.id),
      );
    if (error) throw new Error(`products (drop counts): ${error.message}`);
    productCounts = data ?? [];
  }

  return marketingSchema.parse({
    coupons: [...couponUsage.entries()]
      .map(([code, u]) => {
        const c = couponsByCode.get(code);
        return { code, type: c?.type ?? null, value: c?.value ?? null, ...u };
      })
      .sort((a, b) => b.uses - a.uses || a.code.localeCompare(b.code)),
    coupon_orders: sales.filter((s) => s.coupon_code).length,
    drops: (drops ?? [])
      .map((d) => {
        const goLive = new Date(d.go_live_at).getTime();
        const dropItems = items.filter(
          (i) => i.drop_id === d.id && allSalesById.has(i.order_id) && !i.unavailable,
        );
        const soldWithin = (ms: number) =>
          dropItems.filter((i) => {
            const paidAt = allSalesById.get(i.order_id)?.paid_at;
            return paidAt && new Date(paidAt).getTime() < goLive + ms;
          }).length;
        return {
          id: d.id,
          name: d.name,
          slug: d.slug,
          go_live_at: d.go_live_at,
          pieces: productCounts.filter((p) => p.drop_id === d.id).length,
          sold: dropItems.length,
          sold_first_day: soldWithin(86_400_000),
          sold_first_week: soldWithin(7 * 86_400_000),
          revenue_paise: sum(dropItems, (i) => i.price_paise),
          notify_signups: notifyCountByDrop.get(d.id) ?? 0,
        };
      })
      .sort((a, b) => new Date(b.go_live_at).getTime() - new Date(a.go_live_at).getTime()),
  });
}

// ---------------------------------------------------------------------------
// Fulfilment (was public.insights_fulfilment)
// ---------------------------------------------------------------------------

function durationStats(hours: (number | null)[]) {
  const sorted = hours.filter((h): h is number => h !== null).sort((a, b) => a - b);
  return {
    count: sorted.length,
    median: round(percentileCont(sorted, 0.5), 1),
    p90: round(percentileCont(sorted, 0.9), 1),
  };
}

export async function getFulfilment(ctx: InsightsContext) {
  const orders = await loadOrders(ctx.demo);
  const { from, to } = ctx.range;
  const sales = orders.filter((o) => isSale(o, from, to));
  const hoursBetween = (a: string | null, b: string | null) =>
    a && b ? (new Date(a).getTime() - new Date(b).getTime()) / 3_600_000 : null;

  const toPack = sales.map((s) => hoursBetween(s.packed_at, s.paid_at));
  const toShip = sales.map((s) => hoursBetween(s.shipped_at, s.paid_at));
  const inTransit = sales.map((s) => hoursBetween(s.delivered_at, s.shipped_at));
  const toDeliver = sales.map((s) => hoursBetween(s.delivered_at, s.paid_at));

  const stuckCutoff = Date.now() - 48 * 3_600_000;
  const stuck = orders
    .filter((o) => o.status === "paid" && o.paid_at && new Date(o.paid_at).getTime() < stuckCutoff)
    .sort((a, b) => new Date(a.paid_at!).getTime() - new Date(b.paid_at!).getTime())
    .slice(0, 20)
    .map((o) => ({ id: o.id, paid_at: o.paid_at!, total_paise: o.total_paise }));

  return fulfilmentSchema.parse({
    orders: sales.length,
    to_pack: durationStats(toPack),
    to_ship: durationStats(toShip),
    in_transit: durationStats(inTransit),
    to_deliver: durationStats(toDeliver),
    stuck,
  });
}
