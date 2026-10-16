"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { getWishlistProducts } from "@/lib/actions/wishlist";
import type { ProductCardData } from "@/lib/server/catalogue";
import { useWishlistStore } from "@/lib/stores/wishlist";

const CARD_SIZES = "(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 50vw";

// The wishlist itself. The ids live in the browser for guests and in the account for members
// (lib/stores/wishlist.ts), so this renders on the client: it fetches card data for the ids and
// drops a card the moment its heart is un-ticked.
export function WishlistView() {
  const ids = useWishlistStore((s) => s.ids);
  const session = useWishlistStore((s) => s.session);
  const [products, setProducts] = useState<ProductCardData[] | null>(null);
  const [failed, setFailed] = useState(false);

  // Fetch card data whenever a product we don't have yet appears (removals need no request).
  const missing = ids.filter((id) => !products?.some((p) => p.id === id));
  const key = session === "unknown" ? null : missing.join(",");
  useEffect(() => {
    if (key === null) return;
    let cancelled = false;
    const wanted = useWishlistStore.getState().ids;
    void getWishlistProducts(wanted).then((result) => {
      if (cancelled) return;
      if (result.ok) setProducts(result.data);
      else setFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  if (session === "unknown" || (products === null && !failed)) {
    return (
      <ul
        aria-busy="true"
        aria-label="Loading your wishlist"
        className="mt-8 grid animate-pulse grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4"
      >
        {[0, 1, 2, 3].map((i) => (
          <li key={i} className="aspect-[3/4] bg-surface" />
        ))}
      </ul>
    );
  }

  if (failed) {
    return (
      <p role="alert" className="mt-8 text-sm text-sale">
        We couldn&rsquo;t load your wishlist. Refresh the page to try again.
      </p>
    );
  }

  const shown = (products ?? []).filter((p) => ids.includes(p.id));
  if (shown.length === 0) {
    return (
      <div className="mt-8 border border-border p-8">
        <p className="font-display text-xl">Nothing on your wishlist yet</p>
        <p className="mt-2 text-sm text-muted">Tap the heart on any piece to keep it here.</p>
        <ButtonLink href="/search?sort=newest" className="mt-6">
          Browse new pieces
        </ButtonLink>
      </div>
    );
  }

  return (
    <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
      {shown.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} sizes={CARD_SIZES} />
        </li>
      ))}
    </ul>
  );
}
