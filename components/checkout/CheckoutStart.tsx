"use client";

import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { useCartStore } from "@/lib/stores/cart";
import { useStartCheckout } from "./useStartCheckout";

// /checkout with nothing on hold (opened directly, after signing in, or after a hold ran out):
// offers to hold the cart now.
export function CheckoutStart() {
  const { start, busy, message } = useStartCheckout();
  const ready = useCartStore((s) => s.ready);
  const available = useCartStore((s) => s.lines.filter((l) => l.status === "available").length);

  if (ready && available === 0) {
    return (
      <div className="max-w-md space-y-4">
        <p className="text-muted">Your cart has nothing that can be checked out right now.</p>
        <ButtonLink href="/search?sort=newest">See what&rsquo;s new</ButtonLink>
      </div>
    );
  }

  return (
    <div className="max-w-md space-y-4">
      <p className="text-muted">
        When you continue, the {available > 0 ? available : ""} piece{available === 1 ? "" : "s"} in
        your cart {available === 1 ? "is" : "are"} held for you for 15 minutes while you pay.
      </p>
      {message ? (
        <p role="alert" className="rounded-md bg-surface p-3 text-sm text-sale">
          {message}
        </p>
      ) : null}
      <Button size="lg" disabled={!ready || busy} onClick={() => void start()}>
        {busy ? "Holding your pieces…" : "Continue to checkout"}
      </Button>
    </div>
  );
}
