"use client";

import { useEffect } from "react";
import { hasSupabaseEnv } from "@/lib/env";
import { useCartStore } from "@/lib/stores/cart";
import { useWishlistStore } from "@/lib/stores/wishlist";
import { createClient } from "@/lib/supabase/client";

// Renders nothing. Restores the guest cart from localStorage, then follows the Supabase session:
// on sign-in it merges the guest cart into the account and loads the wishlist; on sign-out it
// clears both. Pages stay cacheable because no server code reads the session for this.
export function CartSync() {
  useEffect(() => {
    void useCartStore.persist.rehydrate();
    if (!hasSupabaseEnv()) {
      useCartStore.getState().markReady();
      useWishlistStore.getState().reset();
      return;
    }

    const supabase = createClient();
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      const userId = session?.user.id ?? null;
      // Supabase advises against awaiting its own calls inside this callback (it can deadlock),
      // so the follow-up work runs on the next tick.
      window.setTimeout(() => {
        if (userId) {
          void useCartStore.getState().signedIn(userId);
          if (event !== "TOKEN_REFRESHED") void useWishlistStore.getState().load();
        } else {
          if (event === "SIGNED_OUT") useCartStore.getState().signedOut();
          else useCartStore.getState().markReady();
          useWishlistStore.getState().reset();
        }
      }, 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return null;
}
