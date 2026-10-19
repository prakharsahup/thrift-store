import type { Metadata } from "next";
import Link from "next/link";
import { BarList } from "@/components/admin/insights/BarList";
import { InsightsSection } from "@/components/admin/insights/InsightsSection";
import { InsightsToolbar } from "@/components/admin/insights/InsightsToolbar";
import { KpiTile } from "@/components/admin/insights/KpiTile";
import { LineChart } from "@/components/admin/insights/LineChart";
import {
  getBreakdown,
  getFulfilment,
  getFunnel,
  getInsightsContext,
  getInventory,
  getSummary,
  getTimeseries,
} from "@/lib/server/insights";
import {
  ageBucketLabels,
  bucketLabel,
  change,
  deriveKpis,
  formatCount,
  formatMoneyCompact,
  formatPercent,
  insightsHref,
} from "@/lib/utils/insights";
import { formatMoney } from "@/lib/utils/money";

export const metadata: Metadata = { title: "Insights" };

const PATH = "/admin/insights";

export default async function InsightsOverviewPage({ searchParams }: PageProps<"/admin/insights">) {
  const ctx = await getInsightsContext(await searchParams);
  const [summary, series, previousSeries, categories, brands, inventory, fulfilment, funnel] =
    await Promise.all([
      getSummary(ctx),
      getTimeseries(ctx),
      getTimeseries(ctx, { previous: true }),
      getBreakdown(ctx, "category"),
      getBreakdown(ctx, "brand"),
      getInventory(ctx),
      getFulfilment(ctx),
      getFunnel(ctx),
    ]);

  const now = deriveKpis(summary.current);
  const before = deriveKpis(summary.previous);
  const productsHref = (dimension: string) =>
    insightsHref(`${PATH}/products`, ctx.params, { dim: dimension });

  const slowStock = inventory.ages
    .filter((a) => a.bucket === "31_60" || a.bucket === "61_plus")
    .reduce((sum, a) => sum + a.count, 0);
  const missingCost = inventory.live_count - inventory.costed_count;
  const attention = [
    fulfilment.stuck.length > 0 && {
      text: `${fulfilment.stuck.length} paid ${fulfilment.stuck.length === 1 ? "order hasn't" : "orders haven't"} been packed after 48 hours`,
      href: insightsHref(`${PATH}/fulfilment`, ctx.params),
    },
    funnel.pieces_lost > 0 && {
      text: `${funnel.pieces_lost} ${funnel.pieces_lost === 1 ? "piece" : "pieces"} sold to someone else first: refunds due`,
      href: "/admin/orders?view=refund",
    },
    slowStock > 0 && {
      text: `${slowStock} ${slowStock === 1 ? "piece has" : "pieces have"} been listed for over a month`,
      href: insightsHref(`${PATH}/inventory`, ctx.params),
    },
    !ctx.demo &&
      missingCost > 0 && {
        text: `${missingCost} listed ${missingCost === 1 ? "piece has" : "pieces have"} no cost entered, so profit is incomplete`,
        href: "/admin/products/costs",
      },
  ].filter((item): item is { text: string; href: string } => Boolean(item));

  const topList = (rows: typeof categories) =>
    rows
      .filter((r) => r.revenue_paise > 0)
      .slice(0, 5)
      .map((r) => ({
        label: r.key,
        value: r.revenue_paise,
        display: formatMoney(r.revenue_paise),
        detail: `${r.items_sold} sold`,
      }));

  return (
    <div className="space-y-6">
      <InsightsToolbar ctx={ctx} path={PATH} />

      {now.orders === 0 && !ctx.demo ? (
        <p className="rounded-md border border-border p-4 text-sm text-muted">
          No paid orders in this range yet. Numbers appear here as soon as the first order is paid.
        </p>
      ) : null}

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <li>
          <KpiTile
            label="Revenue"
            value={formatMoney(now.revenuePaise)}
            change={change(now.revenuePaise, before.revenuePaise)}
          />
        </li>
        <li>
          <KpiTile
            label="Orders"
            value={formatCount(now.orders)}
            change={change(now.orders, before.orders)}
          />
        </li>
        <li>
          <KpiTile
            label="Average order"
            value={now.avgOrderPaise === null ? "–" : formatMoney(now.avgOrderPaise)}
            change={change(now.avgOrderPaise, before.avgOrderPaise)}
          />
        </li>
        <li>
          <KpiTile
            label="Pieces sold"
            value={formatCount(now.itemsSold)}
            change={change(now.itemsSold, before.itemsSold)}
          />
        </li>
        <li>
          <KpiTile
            label="Gross profit"
            value={now.profitPaise === null ? "–" : formatMoney(now.profitPaise)}
            change={change(now.profitPaise, before.profitPaise)}
            detail={
              now.profitPaise === null
                ? "Enter costs to see profit"
                : [
                    now.margin === null ? null : `${formatPercent(now.margin)} margin`,
                    now.costCoverage !== null && now.costCoverage < 1
                      ? `${formatPercent(now.costCoverage)} of pieces costed`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")
            }
          />
        </li>
        <li>
          <KpiTile
            label="Buyers"
            value={formatCount(now.buyers)}
            change={change(now.buyers, before.buyers)}
            detail={`${now.newBuyers} new · ${now.returningBuyers} returning`}
          />
        </li>
        <li>
          <KpiTile
            label="Checkouts completed"
            value={now.conversion === null ? "–" : formatPercent(now.conversion)}
            change={change(now.conversion, before.conversion)}
            detail={`of ${summary.current.checkouts} started`}
          />
        </li>
        <li>
          <KpiTile
            label="Refunds"
            value={formatMoney(now.refundedPaise)}
            change={change(now.refundedPaise, before.refundedPaise)}
            lowerIsBetter
            detail={`${now.refundedOrders} ${now.refundedOrders === 1 ? "order" : "orders"}`}
          />
        </li>
      </ul>

      <InsightsSection
        id="overview-revenue"
        title="Revenue"
        description={`Per ${ctx.range.bucket}, against the period before.`}
        action={
          <Link
            href={insightsHref(`${PATH}/sales`, ctx.params)}
            className="font-semibold text-accent underline"
          >
            Sales report
          </Link>
        }
      >
        <LineChart
          caption={`Revenue per ${ctx.range.bucket}, ${ctx.range.label}`}
          labels={series.map((p) => bucketLabel(p.bucket, ctx.range.bucket))}
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
        <InsightsSection
          id="overview-categories"
          title="Top categories"
          action={
            <Link href={productsHref("category")} className="font-semibold text-accent underline">
              All categories
            </Link>
          }
        >
          <BarList items={topList(categories)} />
        </InsightsSection>
        <InsightsSection
          id="overview-brands"
          title="Top brands"
          action={
            <Link href={productsHref("brand")} className="font-semibold text-accent underline">
              All brands
            </Link>
          }
        >
          <BarList items={topList(brands)} />
        </InsightsSection>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <InsightsSection
          id="overview-stock"
          title="Stock right now"
          description={`${formatCount(inventory.live_count)} pieces listed, worth ${formatMoney(inventory.list_value_paise)} at their prices.`}
          action={
            <Link
              href={insightsHref(`${PATH}/inventory`, ctx.params)}
              className="font-semibold text-accent underline"
            >
              Stock report
            </Link>
          }
        >
          <BarList
            items={inventory.ages.map((a) => ({
              label: ageBucketLabels[a.bucket],
              value: a.count,
              display: `${a.count} pieces`,
              detail: formatMoney(a.value_paise),
            }))}
            empty="Nothing is listed right now."
          />
        </InsightsSection>
        <InsightsSection id="overview-attention" title="Needs attention">
          {attention.length ? (
            <ul className="space-y-2 text-sm">
              {attention.map((item) => (
                <li key={item.text}>
                  <Link href={item.href} className="flex gap-2 hover:underline">
                    <span aria-hidden className="text-sale">
                      ●
                    </span>
                    {item.text}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Nothing needs attention right now.</p>
          )}
        </InsightsSection>
      </div>
    </div>
  );
}
