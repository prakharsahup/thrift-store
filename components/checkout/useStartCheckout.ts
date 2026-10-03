"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { holdCart } from "@/lib/actions/checkout";
import { useCartStore } from "@/lib/stores/cart";

const LOGIN = "/login?next=%2Fcheckout";

/**
 * Starts checkout from the cart: guests go to sign-in first (their cart merges on the way); signed-
 * in shoppers get their available pieces held for 15 minutes, then land on /checkout.
 */
export function useStartCheckout() {
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function start() {
    const cart = useCartStore.getState();
    if (cart.mode === "guest") {
      cart.closeCart();
      router.push(LOGIN);
      return;
    }
    const ids = cart.lines.filter((l) => l.status === "available").map((l) => l.productId);
    if (ids.length === 0) {
      setMessage("Nothing in your cart can be checked out right now.");
      return;
    }

    setBusy(true);
    setMessage(null);
    const result = await holdCart(ids);
    if (!result.ok) {
      setBusy(false);
      if (result.needsLogin) router.push(LOGIN);
      else setMessage(result.message);
      return;
    }

    const taken = result.data.unavailableProductIds.length;
    if (taken > 0) await cart.refresh();
    if (taken === ids.length) {
      setBusy(false);
      setMessage("Someone else just got there first — those pieces are no longer available.");
      return;
    }

    cart.closeCart();
    const target = taken > 0 ? `/checkout?taken=${taken}` : "/checkout";
    if (pathname === "/checkout") router.replace(target);
    else router.push(target);
    router.refresh();
    setBusy(false);
  }

  return { start, busy, message };
}
