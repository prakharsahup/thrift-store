import "server-only";
import type { z } from "zod";
import { requireAdmin } from "@/lib/server/auth";
import { resolveRange, type ResolvedRange } from "@/lib/utils/insights";
import {
  breakdownSchema,
  customersSchema,
  fulfilmentSchema,
  funnelSchema,
  heatmapSchema,
  insightsParamsSchema,
  inventorySchema,
  marketingSchema,
  summarySchema,
  timeseriesSchema,
  type Dimension,
} from "@/lib/validators/insights";

// Reads for /admin/insights. Every report is a Postgres function (…_insights_reports.sql) that
// re-checks the admin role itself; results are parsed with the zod schemas in
// lib/validators/insights.ts, so a changed function fails loudly here instead of rendering
// wrong numbers.

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

function rangeArgs({ range, demo }: InsightsContext) {
  return { p_from: range.from.toISOString(), p_to: range.to.toISOString(), p_demo: demo };
}

/** Runs one report and parses its result. */
async function report<S extends z.ZodType>(
  name: string,
  schema: S,
  call: PromiseLike<{ data: unknown; error: { message: string } | null }>,
): Promise<z.infer<S>> {
  const { data, error } = await call;
  if (error) throw new Error(`${name}: ${error.message}`);
  return schema.parse(data);
}

export function getSummary(ctx: InsightsContext) {
  return report(
    "insights_summary",
    summarySchema,
    ctx.supabase.rpc("insights_summary", rangeArgs(ctx)),
  );
}

/**
 * Sales per day, week or month. With `previous`, the same-length period just before the range,
 * bucket for bucket, for drawing under the current line.
 */
export function getTimeseries(ctx: InsightsContext, { previous = false } = {}) {
  const { from, to } = ctx.range;
  const span = to.getTime() - from.getTime();
  const args = previous
    ? {
        p_from: new Date(from.getTime() - span).toISOString(),
        p_to: from.toISOString(),
        p_demo: ctx.demo,
      }
    : rangeArgs(ctx);
  return report(
    "insights_timeseries",
    timeseriesSchema,
    ctx.supabase.rpc("insights_timeseries", { ...args, p_bucket: ctx.range.bucket }),
  );
}

export function getHeatmap(ctx: InsightsContext) {
  return report(
    "insights_heatmap",
    heatmapSchema,
    ctx.supabase.rpc("insights_heatmap", rangeArgs(ctx)),
  );
}

export function getBreakdown(ctx: InsightsContext, dimension: Dimension) {
  return report(
    "insights_breakdown",
    breakdownSchema,
    ctx.supabase.rpc("insights_breakdown", { ...rangeArgs(ctx), p_dimension: dimension }),
  );
}

/** Stock listed right now; the date range doesn't apply. */
export function getInventory(ctx: InsightsContext) {
  return report(
    "insights_inventory",
    inventorySchema,
    ctx.supabase.rpc("insights_inventory", { p_demo: ctx.demo }),
  );
}

export function getCustomers(ctx: InsightsContext) {
  return report(
    "insights_customers",
    customersSchema,
    ctx.supabase.rpc("insights_customers", rangeArgs(ctx)),
  );
}

export function getFunnel(ctx: InsightsContext) {
  return report(
    "insights_funnel",
    funnelSchema,
    ctx.supabase.rpc("insights_funnel", rangeArgs(ctx)),
  );
}

export function getMarketing(ctx: InsightsContext) {
  return report(
    "insights_marketing",
    marketingSchema,
    ctx.supabase.rpc("insights_marketing", rangeArgs(ctx)),
  );
}

export function getFulfilment(ctx: InsightsContext) {
  return report(
    "insights_fulfilment",
    fulfilmentSchema,
    ctx.supabase.rpc("insights_fulfilment", rangeArgs(ctx)),
  );
}
