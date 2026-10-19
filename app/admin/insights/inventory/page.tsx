import type { Metadata } from "next";
import Link from "next/link";
import { BarList } from "@/components/admin/insights/BarList";
import { InsightsSection } from "@/components/admin/insights/InsightsSection";
import { KpiTile } from "@/components/admin/insights/KpiTile";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { getBreakdown, getInsightsContext, getInventory } from "@/lib/server/insights";
import { ageBucketLabels, formatCount, formatPercent, insightsHref } from "@/lib/utils/insights";
import { formatMoney } from "@/lib/utils/money";

export const metadata: Metadata = { title: "Stock · Insights" };

const PATH = "/admin/insights/inventory";

// Stock is "right now", so this page has no date range, only the demo switch.
export default async function InsightsInventoryPage({
  searchParams,
}: PageProps<"/admin/insights/inventory">) {
  const ctx = await getInsightsContext(await searchParams);
  const [inventory, categories] = await Promise.all([
    getInventory(ctx),
    getBreakdown(ctx, "category"),
  ]);
  const coverage = inventory.live_count ? inventory.costed_count / inventory.live_count : 0;
  const listedByCategory = categories
    .filter((c) => (c.listed_now ?? 0) > 0)
    .sort((a, b) => (b.listed_now ?? 0) - (a.listed_now ?? 0))
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
        <span>
          <span className="font-semibold text-fg">Right now.</span> Stock isn&rsquo;t tied to a date
          range.
        </span>
        {ctx.demo ? (
          <Link
            href={insightsHref(PATH, ctx.params, { demo: null })}
            className="font-semibold text-accent underline"
          >
            Show real costs
          </Link>
        ) : null}
      </p>

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <li>
          <KpiTile label="Pieces listed" value={formatCount(inventory.live_count)} />
        </li>
        <li>
          <KpiTile label="Worth at list price" value={formatMoney(inventory.list_value_paise)} />
        </li>
        <li>
          <KpiTile
            label="Cost tied up"
            value={inventory.costed_count ? formatMoney(inventory.cost_paise) : "–"}
            detail={
              inventory.costed_count
                ? `${formatPercent(coverage)} of pieces costed`
                : "Enter costs to see this"
            }
          />
        </li>
        <li>
          <KpiTile
            label="Drafts"
            value={formatCount(inventory.draft_count)}
            detail="Not listed yet"
          />
        </li>
      </ul>

      {!ctx.demo && coverage < 1 ? (
        <p className="rounded-md border border-border p-4 text-sm">
          {inventory.live_count - inventory.costed_count} listed pieces have no cost yet.{" "}
          <Link href="/admin/products/costs" className="font-semibold text-accent underline">
            Enter costs
          </Link>{" "}
          to see how much money is sitting on the rails, and profit per sale.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <InsightsSection
          id="stock-age"
          title="How long it's been listed"
          description="Pieces over a month old are worth a price drop or a fresh photo."
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
        <InsightsSection
          id="stock-categories"
          title="Listed by category"
          action={
            <Link
              href={insightsHref("/admin/insights/products", ctx.params, {
                dim: "category",
                sort: "sell_through",
              })}
              className="font-semibold text-accent underline"
            >
              Sell-through
            </Link>
          }
        >
          <BarList
            items={listedByCategory.map((c) => ({
              label: c.key,
              value: c.listed_now ?? 0,
              display: `${c.listed_now ?? 0} listed`,
              detail: c.items_sold
                ? `${c.items_sold} sold, ${ctx.range.label.toLowerCase()}`
                : undefined,
            }))}
            empty="Nothing is listed right now."
          />
        </InsightsSection>
      </div>

      <InsightsSection
        id="stock-oldest"
        title="Listed longest"
        description="The 25 pieces that have waited longest for a buyer."
      >
        {inventory.oldest.length ? (
          <ul className="divide-y divide-border">
            {inventory.oldest.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/admin/products/${p.id}`}
                  className="flex items-center gap-3 py-2 hover:bg-surface"
                >
                  <div className="relative aspect-3/4 w-10 shrink-0 overflow-hidden rounded-sm bg-surface">
                    <ImageWithFallback
                      src={p.image_url ?? undefined}
                      alt=""
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{p.title}</p>
                    <p className="truncate text-sm text-muted">{p.brand ?? "No brand"}</p>
                  </div>
                  <div className="shrink-0 text-right text-sm">
                    <p className="font-semibold tabular-nums">{formatMoney(p.price_paise)}</p>
                    <p className="text-muted">
                      {p.days_listed} {p.days_listed === 1 ? "day" : "days"}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Nothing is listed right now.</p>
        )}
      </InsightsSection>
    </div>
  );
}
