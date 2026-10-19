import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { BarList } from "@/components/admin/insights/BarList";
import {
  BreakdownTable,
  breakdownSorts,
  sortBreakdown,
} from "@/components/admin/insights/BreakdownTable";
import { InsightsSection } from "@/components/admin/insights/InsightsSection";
import { InsightsToolbar } from "@/components/admin/insights/InsightsToolbar";
import { getBreakdown, getInsightsContext } from "@/lib/server/insights";
import { cn } from "@/lib/utils/cn";
import {
  dimensionLabels,
  formatPercent,
  insightsHref,
  keyLabel,
  priceBandOrder,
  sellThrough,
} from "@/lib/utils/insights";
import { formatMoney } from "@/lib/utils/money";
import { dimensions, orderDimensions } from "@/lib/validators/insights";

export const metadata: Metadata = { title: "What sells · Insights" };

const PATH = "/admin/insights/products";

const one = z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string().optional());
const pageParams = z.object({
  dim: one.pipe(z.enum(dimensions).optional()).catch(undefined),
  sort: one.pipe(z.enum(breakdownSorts).optional()).catch(undefined),
});

export default async function InsightsProductsPage({
  searchParams,
}: PageProps<"/admin/insights/products">) {
  const query = await searchParams;
  const ctx = await getInsightsContext(query);
  const { dim = "category", sort = "revenue" } = pageParams.parse(query);
  const rows = await getBreakdown(ctx, dim);

  const keep = { dim, ...(sort !== "revenue" && { sort }) };
  const sorted =
    dim === "price_band" && sort === "revenue"
      ? [...rows].sort((a, b) => priceBandOrder.indexOf(a.key) - priceBandOrder.indexOf(b.key))
      : sortBreakdown(rows, sort);
  const selling = rows.filter((r) => r.revenue_paise > 0);
  const isProductDim = !(orderDimensions as readonly string[]).includes(dim);

  // Highlights: the best sell-through among keys with a few sales, and the stock that isn't moving.
  const fastest = [...rows]
    .filter((r) => r.items_sold >= 3 && r.listed_now !== null)
    .sort(
      (a, b) =>
        (sellThrough(b.items_sold, b.listed_now) ?? 0) -
        (sellThrough(a.items_sold, a.listed_now) ?? 0),
    )[0];
  const stuck = [...rows]
    .filter((r) => r.items_sold === 0 && (r.listed_now ?? 0) > 0)
    .sort((a, b) => (b.listed_now ?? 0) - (a.listed_now ?? 0))[0];

  return (
    <div className="space-y-6">
      <InsightsToolbar ctx={ctx} path={PATH} keep={keep} />

      <nav aria-label="Group by" className="flex flex-wrap gap-2 text-sm">
        {dimensions.map((d) => (
          <Link
            key={d}
            href={insightsHref(PATH, ctx.params, { dim: d, sort: null })}
            aria-current={d === dim ? "true" : undefined}
            className={cn(
              "rounded-md border px-3 py-1.5 font-semibold",
              d === dim ? "border-fg bg-fg text-bg" : "border-border hover:border-fg",
            )}
          >
            {dimensionLabels[d]}
          </Link>
        ))}
      </nav>

      {isProductDim && (fastest || stuck) ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {fastest ? (
            <li className="rounded-lg border border-border bg-surface p-4 text-sm">
              <p className="text-muted">Sells fastest</p>
              <p className="mt-1 font-display text-lg font-bold">{keyLabel(dim, fastest.key)}</p>
              <p className="mt-1 text-muted">
                {formatPercent(sellThrough(fastest.items_sold, fastest.listed_now) ?? 0)}{" "}
                sell-through
                {fastest.avg_days_to_sell !== null
                  ? `, about ${Math.round(fastest.avg_days_to_sell)} days to sell`
                  : ""}
                . Worth sourcing more of.
              </p>
            </li>
          ) : null}
          {stuck ? (
            <li className="rounded-lg border border-border bg-surface p-4 text-sm">
              <p className="text-muted">Listed but not selling</p>
              <p className="mt-1 font-display text-lg font-bold">{keyLabel(dim, stuck.key)}</p>
              <p className="mt-1 text-muted">
                {stuck.listed_now} listed, none sold in this range. Try a price drop, better photos
                or a bundle.
              </p>
            </li>
          ) : null}
        </ul>
      ) : null}

      <InsightsSection
        id="products-top"
        title={`Revenue by ${dimensionLabels[dim].toLowerCase()}`}
        description={
          dim === "style"
            ? "A piece with several style tags counts under each of them."
            : "Top 8 in this range."
        }
      >
        <BarList
          items={(dim === "price_band" ? sorted : selling)
            .filter((r) => r.revenue_paise > 0)
            .slice(0, 8)
            .map((r) => ({
              label: keyLabel(dim, r.key),
              value: r.revenue_paise,
              display: formatMoney(r.revenue_paise),
              detail: `${r.items_sold} sold`,
            }))}
        />
      </InsightsSection>

      <InsightsSection
        id="products-table"
        title="Everything"
        description={
          isProductDim
            ? "Sell-through: share of pieces sold out of those sold plus those still listed. Days to sell: from listing to payment."
            : "Pieces sold in this range, grouped by where orders shipped or how they were paid."
        }
      >
        {rows.length ? (
          <BreakdownTable
            dimension={dim}
            rows={sorted}
            sort={sort}
            sortHref={(s) =>
              insightsHref(PATH, ctx.params, { dim, sort: s === "revenue" ? null : s })
            }
          />
        ) : (
          <p className="text-sm text-muted">Nothing sold in this range yet.</p>
        )}
      </InsightsSection>
    </div>
  );
}
