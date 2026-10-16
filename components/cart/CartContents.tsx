"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { shippingFor } from "@/lib/config/shipping";
import { useStartCheckout } from "@/components/checkout/useStartCheckout";
import { useCartStore } from "@/lib/stores/cart";
import { cn } from "@/lib/utils/cn";
import { formatMoney } from "@/lib/utils/money";
import { CartLine } from "./CartLine";

type Props = {
  /** "drawer" adds a link to the full cart page; "page" doesn't. */
  variant: "drawer" | "page";
};

// The cart itself, shared by the drawer and /cart: lines, subtotal and the checkout button.
// Totals here are estimates for display; checkout recomputes on the server.
export function CartContents({ variant }: Props) {
  const lines = useCartStore((s) => s.lines);
  const error = useCartStore((s) => s.error);
  const closeCart = useCartStore((s) => s.closeCart);
  const ready = useCartStore((s) => s.ready);
  const checkout = useStartCheckout();

  const buyable = lines.filter((l) => l.status === "available");
  const subtotal = buyable.reduce((sum, l) => sum + l.pricePaise, 0);
  const shippingCost = buyable.length ? shippingFor(subtotal) : 0;
  const blocked = lines.length > buyable.length;

  if (!ready) {
    return (
      <div aria-busy="true" aria-label="Loading your cart" className="animate-pulse space-y-4 p-6">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-24 w-18 rounded-md bg-surface" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3 w-2/3 rounded-sm bg-surface" />
              <div className="h-3 w-1/3 rounded-sm bg-surface" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <ShoppingBag aria-hidden className="size-10 text-muted" />
        <p className="font-display text-lg font-bold">Your cart is empty</p>
        <p className="max-w-xs text-sm text-muted">
          Every piece here is one of one. When you find yours, add it before someone else does.
        </p>
        <ButtonLink href="/search?sort=newest" onClick={closeCart}>
          See what&rsquo;s new
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ul
        className={cn(
          "divide-y divide-border px-4 md:px-6",
          variant === "drawer" && "min-h-0 flex-1 overflow-y-auto overscroll-contain",
        )}
      >
        {lines.map((line) => (
          <CartLine key={line.productId} line={line} />
        ))}
      </ul>

      <div className="border-t border-border px-4 py-4 md:px-6">
        {error ? (
          <p role="alert" className="mb-3 text-sm text-sale">
            {error}
          </p>
        ) : null}
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="font-semibold">{formatMoney(subtotal)}</dd>
          </div>
          <div className="flex justify-between text-muted">
            <dt>Shipping</dt>
            <dd>{shippingCost === 0 ? "Free" : formatMoney(shippingCost)}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-muted">
          Prices include all taxes. Items aren&rsquo;t held until you start checkout — then
          they&rsquo;re yours for 15 minutes.
        </p>
        {checkout.message ? (
          <p role="alert" className="mt-3 text-sm text-sale">
            {checkout.message}
          </p>
        ) : null}
        <Button
          size="lg"
          fullWidth
          disabled={blocked || buyable.length === 0 || checkout.busy}
          aria-describedby={blocked ? "checkout-note" : undefined}
          className="mt-4"
          onClick={() => void checkout.start()}
        >
          {checkout.busy ? "Holding your pieces…" : "Checkout"}
        </Button>
        {blocked ? (
          <p id="checkout-note" className="mt-2 text-center text-xs text-muted">
            Remove unavailable pieces to check out.
          </p>
        ) : null}
        {variant === "drawer" ? (
          <Link
            href="/cart"
            onClick={closeCart}
            className="mt-3 block text-center text-sm font-semibold text-accent underline"
          >
            View full cart
          </Link>
        ) : null}
      </div>
    </div>
  );
}
