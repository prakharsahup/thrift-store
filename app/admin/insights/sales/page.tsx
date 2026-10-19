import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { BarList } from "@/components/admin/insights/BarList";
import { ColumnChart } from "@/components/admin/insights/ColumnChart";
import { Heatmap } from "@/components/admin/insights/Heatmap";
import { InsightsSection } from "@/components/admin/insights/InsightsSection";
import { InsightsToolbar } from "@/components/admin/insights/InsightsToolbar";
import { LineChart } from "@/components/admin/insights/LineChart";
import {
  getBreakdown,
  getFunnel,
  getHeatmap,
  getInsightsContext,
  getSummary,
  getTimeseries,
} from "@/lib/server/insights";
import { cn } from "@/lib/utils/cn";
import {
  bucketLabel,
  deriveKpis,
  formatMoneyCompact,
  formatPercent,
  insightsHref,
  keyLabel,
} from "@/lib/utils/insights";
import { formatMoney } from "@/lib/utils/money";
import { buckets } from "@/lib/validators/insights";

export const metadata: Metadata = { title: "Sales · Insights" };

const PATH = "/admin/insights/sales";

const bucketNames = { day: "Daily", week: "Weekly", month: "Monthly" } as const;

export default async function InsightsSalesPage({
  searchParams,
}: PageProps<"/admin/insights/sales">) {
  const ctx = await getInsightsContext(await searchParams);
  const [summary, series, previousSeries, heatmap, payments, funnel] = await Promise.all([
    getSummary(ctx),
    getTimeseries(ctx),
    getTimeseries(ctx, { previous: true }),
    getHeatmap(ctx),
    getBreakdown(ctx, "payment_method"),
    getFunnel(ctx),
  ]);
  const k = deriveKpis(summary.current);
  const labels = series.map((p) => bucketLabel(p.bucket, ctx.range.bucket));
  const per = ctx.range.bucket;

  const money: [string, string][] = [
    ["Pieces sold", formatMoney(summary.current.merchandise_paise)],
    ["Shipping charged", formatMoney(k.shippingPaise)],
    ["Coupon discounts", `−${formatMoney(k.discountPaise)}`],
    ["Sold to someone else first (refunded)", `−${formatMoney(summary.current.unavailable_paise)}`],
    ["Revenue", formatMoney(k.revenuePaise)],
  ];

  const steps = [
    { label: "Checkouts started", value: funnel.started },
    { label: "Paid", value: funnel.paid },
    { label: "Abandoned (hold expired, nothing charged)", value: funnel.abandoned },
    { label: "Still waiting for payment", value: funnel.pending },
    { label: "Paid too late (refund by hand)", value: funnel.late_payments },
    { label: "Refunded", value: funnel.refunded },
  ];

  return (
    <div className="space-y-6">
      <InsightsToolbar ctx={ctx} path={PATH} />

      {!ctx.demo ? (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <Download aria-hidden className="size-4 text-muted" />
          <span className="text-muted">Download this range as CSV:</span>
          <a
            href={insightsHref("/admin/insights/export", ctx.params, {
              type: "orders",
              bucket: null,
            })}
            className="font-semibold text-accent underline"
          >
            Orders
          </a>
          <a
            href={insightsHref("/admin/insights/export", ctx.params, {
              type: "items",
              bucket: null,
            })}
            className="font-semibold text-accent underline"
          >
            Pieces sold (with cost and profit)
          </a>
        </p>
      ) : null}

      <nav aria-label="Chart detail" className="flex flex-wrap gap-2 text-sm">
        {buckets.map((b) => {
          const current = b === per;
          const disabled = b === "day" && ctx.range.days > 731;
          return disabled ? null : (
            <Link
              key={b}
              href={insightsHref(PATH, ctx.params, { bucket: b })}
              aria-current={current ? "true" : undefined}
              className={cn(
                "rounded-md border px-3 py-1.5 font-semibold",
                current ? "border-fg bg-fg text-bg" : "border-border hover:border-fg",
              )}
            >
              {bucketNames[b]}
            </Link>
          );
        })}
      </nav>

      <InsightsSection
        id="sales-revenue"
        title="Revenue"
        description={`Per ${per}, against the period before.`}
      >
        <LineChart
          caption={`Revenue per ${per}, ${ctx.range.label}`}
          labels={labels}
          series={[
            {
              label: "This period",
              values: series.map((p) => p.revenue_paise),
              tone: "primary",
              area: true,
            },
            {
              label: "Period before",
              values: series.map((_, i) => previousSeries[i]?.revenue_paise ?? 0),
              tone: "muted",
              dashed: true,
            },
          ]}
          format={formatMoney}
          formatAxis={formatMoneyCompact}
        />
      </InsightsSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <InsightsSection id="sales-orders" title="Orders" description={`Paid orders per ${per}.`}>
          <ColumnChart
            caption={`Orders per ${per}, ${ctx.range.label}`}
            labels={labels}
            values={series.map((p) => p.orders)}
            valueLabel="Orders"
          />
        </InsightsSection>
        <InsightsSection
          id="sales-profit"
          title="Gross profit"
          description={
            k.costCoverage === null || k.costCoverage === 0
              ? "Enter what pieces cost to see profit."
              : `Price minus cost, per ${per}${k.costCoverage < 1 ? `, over the ${formatPercent(k.costCoverage)} of pieces with a cost` : ""}.`
          }
          action={
            !ctx.demo && (k.costCoverage ?? 0) < 1 ? (
              <Link href="/admin/products/costs" className="font-semibold text-accent underline">
                Enter costs
              </Link>
            ) : null
          }
        >
          <LineChart
            caption={`Gross profit per ${per}, ${ctx.range.label}`}
            labels={labels}
            series={[
              {
                label: "Gross profit",
                values: series.map((p) => p.profit_paise),
                tone: "accent",
                area: true,
              },
            ]}
            format={formatMoney}
            formatAxis={formatMoneyCompact}
          />
        </InsightsSection>
      </div>

      <InsightsSection
        id="sales-when"
        title="When people buy"
        description="Paid orders by day and hour, India time. Good for timing drops and posts."
      >
        <Heatmap cells={heatmap} />
      </InsightsSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <InsightsSection id="sales-money" title="Where the money comes from">
          <dl className="divide-y divide-border text-sm">
            {money.map(([label, value], i) => (
              <div
                key={label}
                className={cn(
                  "flex justify-between gap-4 py-2",
                  i === money.length - 1 && "font-bold",
                )}
              >
                <dt>{label}</dt>
                <dd className="tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
          {k.refundedOrders ? (
            <p className="mt-3 text-xs text-muted">
              Not included: {k.refundedOrders} refunded{" "}
              {k.refundedOrders === 1 ? "order" : "orders"} worth {formatMoney(k.refundedPaise)}.
            </p>
          ) : null}
        </InsightsSection>

        <InsightsSection id="sales-payments" title="How people pay">
          <BarList
            items={payments.map((p) => ({
              label: keyLabel("payment_method", p.key),
              value: p.orders,
              display: `${p.orders} ${p.orders === 1 ? "order" : "orders"}`,
              detail: formatMoney(p.revenue_paise),
            }))}
          />
        </InsightsSection>
      </div>

      <InsightsSection
        id="sales-checkout"
        title="Checkout"
        description="What happened to checkouts started in this range. Each one holds its pieces for 15 minutes."
      >
        <BarList
          items={steps.map((s) => ({
            label: s.label,
            value: s.value,
            display: String(s.value),
            detail:
              funnel.started && s !== steps[0]
                ? formatPercent(s.value / funnel.started)
                : undefined,
          }))}
          empty="No checkouts started in this range."
        />
        {funnel.pieces_lost ? (
          <p className="mt-4 text-sm text-muted">
            {funnel.pieces_lost} {funnel.pieces_lost === 1 ? "piece was" : "pieces were"} bought by
            someone else a moment before payment landed, and refunded.
          </p>
        ) : null}
      </InsightsSection>
    </div>
  );
}
