import { z } from "zod";

// URL params for /admin/insights pages, and the shapes the insights_* Postgres functions return
// (supabase/migrations/…_insights_reports.sql). The functions return jsonb, which arrives untyped,
// so every result is parsed here before a page touches it.

export const rangePresets = ["7d", "30d", "90d", "12m", "ytd", "custom"] as const;
export type RangePreset = (typeof rangePresets)[number];

export const buckets = ["day", "week", "month"] as const;
export type Bucket = (typeof buckets)[number];

/** Product attributes (these also report stock listed now) first, then order attributes. */
export const productDimensions = [
  "category",
  "brand",
  "style",
  "condition",
  "size",
  "gender",
  "price_band",
  "drop",
] as const;
export const orderDimensions = ["state", "city", "payment_method"] as const;
export const dimensions = [...productDimensions, ...orderDimensions] as const;
export type Dimension = (typeof dimensions)[number];

const isoDate = z.iso.date();

/** One value from a search param that may be repeated. */
const param = z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string().optional());

export const insightsParamsSchema = z.object({
  range: param.pipe(z.enum(rangePresets).optional()).catch(undefined),
  from: param.pipe(isoDate.optional()).catch(undefined),
  to: param.pipe(isoDate.optional()).catch(undefined),
  bucket: param.pipe(z.enum(buckets).optional()).catch(undefined),
  /** "1" shows generated demo data instead of real orders. */
  demo: param.transform((v) => v === "1").catch(false),
});

export type InsightsParams = z.infer<typeof insightsParamsSchema>;

// ---------------------------------------------------------------------------
// Function results
// ---------------------------------------------------------------------------

const count = z.number().int().nonnegative();
const paise = z.number().int();

export const kpisSchema = z.object({
  orders: count,
  gross_paise: paise,
  discount_paise: paise,
  shipping_paise: paise,
  items_sold: count,
  merchandise_paise: paise,
  unavailable_items: count,
  unavailable_paise: paise,
  costed_items: count,
  costed_revenue_paise: paise,
  cost_paise: paise,
  buyers: count,
  new_buyers: count,
  refunded_orders: count,
  refunded_paise: paise,
  checkouts: count,
  checkouts_paid: count,
});
export type Kpis = z.infer<typeof kpisSchema>;

export const summarySchema = z.object({ current: kpisSchema, previous: kpisSchema });

export const timeseriesSchema = z.array(
  z.object({
    bucket: isoDate,
    orders: count,
    revenue_paise: paise,
    items: count,
    profit_paise: paise,
  }),
);
export type TimeseriesPoint = z.infer<typeof timeseriesSchema>[number];

export const heatmapSchema = z.array(
  z.object({
    dow: z.number().int().min(1).max(7),
    hour: z.number().int().min(0).max(23),
    orders: count,
    revenue_paise: paise,
  }),
);

export const breakdownSchema = z.array(
  z.object({
    key: z.string(),
    items_sold: count,
    orders: count,
    revenue_paise: paise,
    costed_items: count,
    costed_revenue_paise: paise,
    cost_paise: paise,
    avg_days_to_sell: z.number().nullable(),
    avg_retail_ratio: z.number().nullable(),
    /** Null for order attributes (state, city, payment method). */
    listed_now: count.nullable(),
  }),
);
export type BreakdownRow = z.infer<typeof breakdownSchema>[number];

export const ageBuckets = ["0_14", "15_30", "31_60", "61_plus"] as const;

export const inventorySchema = z.object({
  live_count: count,
  list_value_paise: paise,
  costed_count: count,
  cost_paise: paise,
  draft_count: count,
  ages: z.array(z.object({ bucket: z.enum(ageBuckets), count, value_paise: paise })),
  oldest: z.array(
    z.object({
      id: z.string(),
      slug: z.string(),
      title: z.string(),
      brand: z.string().nullable(),
      price_paise: paise,
      days_listed: count,
      image_url: z.string().nullable(),
    }),
  ),
});

const place = z.object({ key: z.string(), orders: count, revenue_paise: paise });

export const customersSchema = z.object({
  buyers: count,
  new_buyers: count,
  orders_from_returning: count,
  lifetime_buyers: count,
  lifetime_repeat_buyers: count,
  top_buyers: z.array(z.object({ email: z.string(), orders: count, spent_paise: paise })),
  states: z.array(place),
  cities: z.array(place),
});

export const funnelSchema = z.object({
  started: count,
  paid: count,
  pending: count,
  abandoned: count,
  late_payments: count,
  refunded: count,
  pieces_lost: count,
});

export const marketingSchema = z.object({
  coupons: z.array(
    z.object({
      code: z.string(),
      /** Null when the coupon has since been deleted. */
      type: z.enum(["percent", "flat"]).nullable(),
      value: z.number().nullable(),
      uses: count,
      discount_paise: paise,
      revenue_paise: paise,
    }),
  ),
  coupon_orders: count,
  drops: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      go_live_at: z.string(),
      pieces: count,
      sold: count,
      sold_first_day: count,
      sold_first_week: count,
      revenue_paise: paise,
      notify_signups: count,
    }),
  ),
});

const duration = z.object({
  count,
  median: z.number().nullable(),
  p90: z.number().nullable(),
});

export const fulfilmentSchema = z.object({
  orders: count,
  to_pack: duration,
  to_ship: duration,
  in_transit: duration,
  to_deliver: duration,
  stuck: z.array(z.object({ id: z.string(), paid_at: z.string(), total_paise: paise })),
});
