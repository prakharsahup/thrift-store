import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { formatPercent, keyLabel, sellThrough } from "@/lib/utils/insights";
import { formatMoney } from "@/lib/utils/money";
import type { BreakdownRow, Dimension } from "@/lib/validators/insights";

export const breakdownSorts = ["revenue", "items", "profit", "sell_through", "days"] as const;
export type BreakdownSort = (typeof breakdownSorts)[number];

type Props = {
  dimension: Dimension;
  rows: BreakdownRow[];
  sort: BreakdownSort;
  /** Link for a column header that sorts by it. */
  sortHref: (sort: BreakdownSort) => string;
};

function profit(row: BreakdownRow): number | null {
  return row.costed_items ? row.costed_revenue_paise - row.cost_paise : null;
}

/** Rows in the chosen order; ties fall back to revenue. Rows without a value sort last. */
export function sortBreakdown(rows: BreakdownRow[], sort: BreakdownSort): BreakdownRow[] {
  const value = (r: BreakdownRow): number | null => {
    switch (sort) {
      case "items":
        return r.items_sold;
      case "profit":
        return profit(r);
      case "sell_through":
        return sellThrough(r.items_sold, r.listed_now);
      case "days":
        // Fastest first.
        return r.avg_days_to_sell === null ? null : -r.avg_days_to_sell;
      default:
        return r.revenue_paise;
    }
  };
  return [...rows].sort((a, b) => {
    const va = value(a);
    const vb = value(b);
    if (va === vb) return b.revenue_paise - a.revenue_paise;
    if (va === null) return 1;
    if (vb === null) return -1;
    return vb - va;
  });
}

// The full breakdown. Scrolls sideways inside its own box on small screens (the page never does);
// the first column stays put so each row stays readable.
export function BreakdownTable({ dimension, rows, sort, sortHref }: Props) {
  const stock = rows.some((r) => r.listed_now !== null);
  const columns: { key: BreakdownSort | null; label: string; hidden?: boolean }[] = [
    { key: "items", label: "Sold" },
    { key: "revenue", label: "Revenue" },
    { key: "profit", label: "Profit" },
    { key: "sell_through", label: "Sell-through", hidden: !stock },
    { key: "days", label: "Days to sell" },
    { key: null, label: "Listed now", hidden: !stock },
    { key: null, label: "Price vs retail" },
  ];

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full min-w-[44rem] text-sm">
        <thead className="bg-surface text-left">
          <tr>
            <th scope="col" className="sticky left-0 bg-surface px-3 py-2">
              Name
            </th>
            {columns
              .filter((c) => !c.hidden)
              .map((c) => (
                <th
                  key={c.label}
                  scope="col"
                  className="px-3 py-2 text-right whitespace-nowrap"
                  aria-sort={c.key && c.key === sort ? "descending" : undefined}
                >
                  {c.key ? (
                    <Link
                      href={sortHref(c.key)}
                      className={cn("hover:underline", c.key === sort && "text-accent")}
                    >
                      {c.label}
                      {c.key === sort ? <span aria-hidden> ↓</span> : null}
                    </Link>
                  ) : (
                    c.label
                  )}
                </th>
              ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => {
            const p = profit(r);
            const st = sellThrough(r.items_sold, r.listed_now);
            return (
              <tr key={r.key}>
                <th
                  scope="row"
                  className="sticky left-0 max-w-56 truncate bg-bg px-3 py-2 text-left font-semibold"
                >
                  {keyLabel(dimension, r.key)}
                </th>
                <td className="px-3 py-2 text-right tabular-nums">{r.items_sold}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatMoney(r.revenue_paise)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {p === null ? (
                    <span className="text-muted">–</span>
                  ) : (
                    <>
                      {formatMoney(p)}
                      {r.costed_revenue_paise ? (
                        <span className="ml-1 text-xs text-muted">
                          {formatPercent(p / r.costed_revenue_paise)}
                        </span>
                      ) : null}
                    </>
                  )}
                </td>
                {stock ? (
                  <td className="px-3 py-2 text-right tabular-nums">
                    {st === null ? <span className="text-muted">–</span> : formatPercent(st)}
                  </td>
                ) : null}
                <td className="px-3 py-2 text-right tabular-nums">
                  {r.avg_days_to_sell === null ? (
                    <span className="text-muted">–</span>
                  ) : (
                    `${r.avg_days_to_sell}`
                  )}
                </td>
                {stock ? (
                  <td className="px-3 py-2 text-right tabular-nums">{r.listed_now ?? "–"}</td>
                ) : null}
                <td className="px-3 py-2 text-right tabular-nums">
                  {r.avg_retail_ratio === null ? (
                    <span className="text-muted">–</span>
                  ) : (
                    formatPercent(r.avg_retail_ratio)
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
