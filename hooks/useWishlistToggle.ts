"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useWishlistStore } from "@/lib/stores/wishlist";

/**
 * Save / un-save one product, shared by the PDP button and the heart on product cards. Works
 * signed out (saved in this browser); only an expired member session is sent to sign in again.
 */
export function useWishlistToggle(productId: string) {
  const router = useRouter();
  const pathname = usePathname();
  const saved = useWishlistStore((s) => s.ids.includes(productId));
  const toggleInStore = useWishlistStore((s) => s.toggle);
  const [error, setError] = useState(false);

  async function toggle() {
    setError(false);
    const result = await toggleInStore(productId);
    if (result === "login") router.push(`/login?next=${encodeURIComponent(pathname)}`);
    if (result === "error") setError(true);
  }

  return { saved, error, toggle };
}
