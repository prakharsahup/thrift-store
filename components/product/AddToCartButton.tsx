"use client";

import { Check } from "lucide-react";
import type { CartLine } from "@/lib/cart/types";
import { useCartStore } from "@/lib/stores/cart";
import { cn } from "@/lib/utils/cn";

type Props = { line: CartLine; className?: string };

// PDP "Add to cart": adds the piece and opens the drawer. Adding does NOT reserve it — the 15-minute
// hold starts at checkout (CLAUDE.md §4). Disabled with "Sold" / "On hold" when it can't be bought.
export function AddToCartButton({ line, className }: Props) {
  const inCart = useCartStore((s) => s.lines.some((l) => l.productId === line.productId));
  const add = useCartStore((s) => s.add);
  const openCart = useCartStore((s) => s.openCart);
  const showCart = useCartStore((s) => s.showCart);
  const { status } = line;
  const buyable = status === "available";

  return (
    <div className={className}>
      {buyable && inCart ? (
        <button
          type="button"
          onClick={openCart}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border-2 border-fg text-sm font-semibold tracking-wide uppercase hover:bg-fg hover:text-bg"
        >
          <Check aria-hidden className="size-4" />
          In your cart — view
        </button>
      ) : (
        <button
          type="button"
          disabled={!buyable}
          aria-describedby={buyable ? undefined : "add-to-cart-note"}
          onClick={() => {
            void add(line);
            showCart();
          }}
          className={cn(
            "h-12 w-full rounded-md text-sm font-semibold tracking-wide uppercase disabled:cursor-not-allowed",
            buyable ? "bg-primary text-primary-fg hover:bg-fg" : "bg-sold text-fg",
          )}
        >
          {status === "sold" ? "Sold" : status === "reserved" ? "On hold" : "Add to cart"}
        </button>
      )}
      {buyable ? null : (
        <p id="add-to-cart-note" className="mt-2 text-xs text-muted">
          {status === "reserved"
            ? "Someone is checking out with this piece. If they don't finish within 15 minutes, it comes back."
            : "This one found a new home. Similar pieces are below."}
        </p>
      )}
    </div>
  );
}
