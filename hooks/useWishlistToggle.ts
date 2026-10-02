"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useWishlistStore } from "@/lib/stores/wishlist";

/**
 * Save / un-save one product, shared by the PDP button and the heart on product cards.
 * Signed-out visitors are sent to sign in and brought back to the page they were on.
 */
export function useWishlistToggle(productId: string) {
  const router = useRouter();
  const pathname = usePathname();
  const saved = useWishlistStore((s) => s.ids.includes(productId));
  const session = useWishlistStore((s) => s.session);
  const toggleInStore = useWishlistStore((s) => s.toggle);
  const [error, setError] = useState(false);

  async function toggle() {
    setError(false);
    const toLogin = () => router.push(`/login?next=${encodeURIComponent(pathname)}`);
    if (session === "guest") {
      toLogin();
      return;
    }
    const result = await toggleInStore(productId);
    if (result === "login") toLogin();
    if (result === "error") setError(true);
  }

  return { saved, error, toggle };
}
