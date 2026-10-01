import Link from "next/link";
import { ProductCard } from "@/components/product/ProductCard";
import type { ProductCardData } from "@/lib/server/catalogue";

type Props = {
  products: ProductCardData[];
  total: number;
  /** Link to the next page of results, or null when everything is shown. */
  loadMoreHref: string | null;
  /** Shown when there are no results. */
  emptyState: React.ReactNode;
};

// 2 columns on phones, 3 on tablets and 4 on wide desktops (CLAUDE.md §5). The first row loads
// eagerly; next/image lazy-loads the rest.
const CARD_SIZES = "(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 50vw";

export function ProductGrid({ products, total, loadMoreHref, emptyState }: Props) {
  if (products.length === 0) return <div className="py-16 text-center">{emptyState}</div>;

  return (
    <div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} sizes={CARD_SIZES} />
          </li>
        ))}
      </ul>
      <div className="mt-12 flex flex-col items-center gap-3">
        <p className="text-sm text-muted" aria-live="polite">
          Showing {products.length} of {total} {total === 1 ? "piece" : "pieces"}
        </p>
        {loadMoreHref ? (
          <Link
            href={loadMoreHref}
            scroll={false}
            className="inline-flex h-11 items-center rounded-md border border-fg px-6 text-sm font-semibold hover:bg-fg hover:text-bg"
          >
            Load more
          </Link>
        ) : null}
      </div>
    </div>
  );
}
