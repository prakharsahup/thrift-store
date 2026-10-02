import { ProductCard } from "@/components/product/ProductCard";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { cn } from "@/lib/utils/cn";
import type { ProductCardData } from "@/lib/server/catalogue";

type Props = {
  products: ProductCardData[];
  total: number;
  /** Link to the next page of results, or null when everything is shown. */
  loadMoreHref: string | null;
  /** Shown when there are no results. */
  emptyState: React.ReactNode;
  /**
   * Teaser grids (gender landings): hide the last few cards so every row is full at 2, 3 and 4
   * columns, and skip the "Showing x of y" line. Pass 12 products: it divides evenly by all three.
   */
  fullRowsOnly?: boolean;
};

// 2 columns on phones, 3 on tablets and 4 on wide desktops (CLAUDE.md §5). The first row loads
// eagerly; next/image lazy-loads the rest.
const CARD_SIZES = "(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 50vw";

/** Classes that hide card `i` (of `count`) wherever it would start an incomplete last row. */
function fullRowClasses(i: number, count: number): string {
  const lastFull = (cols: number) => (count < cols ? count : count - (count % cols));
  return cn(
    i >= lastFull(2) && "max-md:hidden",
    i >= lastFull(3) && "md:max-xl:hidden",
    i >= lastFull(4) && "xl:hidden",
  );
}

export function ProductGrid({
  products,
  total,
  loadMoreHref,
  emptyState,
  fullRowsOnly = false,
}: Props) {
  if (products.length === 0) return <div className="py-16 text-center">{emptyState}</div>;

  return (
    <div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
        {products.map((product, i) => (
          <li
            key={product.id}
            className={fullRowsOnly ? fullRowClasses(i, products.length) : undefined}
          >
            <ProductCard product={product} sizes={CARD_SIZES} />
          </li>
        ))}
      </ul>
      <div className="mt-12 flex flex-col items-center gap-3 empty:hidden">
        {fullRowsOnly ? null : (
          <p className="text-sm text-muted" aria-live="polite">
            Showing {products.length} of {total} {total === 1 ? "piece" : "pieces"}
          </p>
        )}
        {loadMoreHref ? (
          <ButtonLink href={loadMoreHref} scroll={false} variant="outline">
            Load more
          </ButtonLink>
        ) : null}
      </div>
    </div>
  );
}
