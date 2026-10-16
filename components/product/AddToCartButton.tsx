"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { CartLine } from "@/lib/cart/types";
import { useCartStore } from "@/lib/stores/cart";

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
        <Button variant="outline" size="lg" fullWidth onClick={openCart}>
          <Check aria-hidden />
          In your cart — view
        </Button>
      ) : (
        <Button
          variant={buyable ? "primary" : "sold"}
          size="lg"
          fullWidth
          disabled={!buyable}
          aria-describedby={buyable ? undefined : "add-to-cart-note"}
          onClick={() => {
            void add(line);
            showCart();
          }}
        >
          {status === "sold" ? "Claimed" : status === "reserved" ? "On hold" : "Add to cart"}
        </Button>
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
