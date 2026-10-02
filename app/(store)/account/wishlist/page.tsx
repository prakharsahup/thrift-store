import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { removeFromWishlistForm } from "@/lib/actions/wishlist";
import { requireUser } from "@/lib/server/auth";
import { getCartProducts } from "@/lib/server/catalogue";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

const CARD_SIZES = "(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 50vw";

// Saved pieces, newest first. Sold pieces stay here (with a SOLD badge): if one comes back, we
// email you (drops phase).
export default async function WishlistPage() {
  const { supabase } = await requireUser("/account/wishlist");
  const { data } = await supabase
    .from("wishlists")
    .select("product_id")
    .order("created_at", { ascending: false });
  const products = await getCartProducts((data ?? []).map((row) => row.product_id));

  return (
    <div className="site-container py-6 md:py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Account", href: "/account" },
          { label: "Wishlist" },
        ]}
      />
      <h1 className="mt-4 text-2xl font-bold md:text-3xl">Wishlist</h1>
      <p className="mt-2 max-w-prose text-sm text-muted">
        Saving a piece doesn&rsquo;t hold it — there&rsquo;s only one of each. If a saved piece
        sells and later comes back, we&rsquo;ll email you.
      </p>

      {products.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-display text-xl font-bold">Nothing saved yet</p>
          <p className="mt-2 text-sm text-muted">Tap the heart on any piece to keep it here.</p>
          <ButtonLink href="/search?sort=newest" className="mt-6">
            Browse new pieces
          </ButtonLink>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} sizes={CARD_SIZES} />
              <form action={removeFromWishlistForm} className="mt-2">
                <input type="hidden" name="productId" value={product.id} />
                <Button type="submit" variant="link" className="text-xs">
                  Remove<span className="sr-only"> {product.title} from wishlist</span>
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
