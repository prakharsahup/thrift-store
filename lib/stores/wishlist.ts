import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { loadWishlistIds, mergeGuestWishlist, setWishlisted } from "@/lib/actions/wishlist";

// Which products are on the wishlist, so heart buttons on cached pages can show their state.
//
// Signed out ("guest"): ids live here and are persisted to localStorage, so anyone can save
// pieces without an account.
// Signed in ("member"): ids are stored in the database (wishlists); this store mirrors them. On
// sign-in the guest wishlist is merged into the account (CartSync calls signedIn).

type WishlistState = {
  ids: string[];
  /** "unknown" until the first auth check finishes. */
  session: "unknown" | "guest" | "member";
  /** Called by CartSync once a session is known. */
  signedIn: () => Promise<void>;
  /** Signed out on this device: back to an empty guest list. */
  signedOut: () => void;
  /** No session: keep whatever the guest saved in this browser. */
  markGuest: () => void;
  /** Returns "login" when a member's session has expired. */
  toggle: (productId: string) => Promise<"ok" | "login" | "error">;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      session: "unknown",

      signedIn: async () => {
        const guestIds = get().session === "member" ? [] : get().ids;
        const result =
          guestIds.length > 0 ? await mergeGuestWishlist(guestIds) : await loadWishlistIds();
        if (result.ok) set({ ids: result.data, session: "member" });
      },

      signedOut: () => set({ ids: [], session: "guest" }),

      markGuest: () => set({ session: "guest" }),

      toggle: async (productId) => {
        const saved = !get().ids.includes(productId);
        const previous = get().ids;
        set({ ids: saved ? [...previous, productId] : previous.filter((id) => id !== productId) });
        if (get().session !== "member") return "ok";

        const result = await setWishlisted(productId, saved);
        if (result.ok) return "ok";
        set({ ids: previous });
        return result.needsLogin ? "login" : "error";
      },
    }),
    {
      name: "wishlist",
      storage: createJSONStorage(() => localStorage),
      // Only the guest's ids are kept; a member's list always comes from the database.
      partialize: (state) => ({ ids: state.session === "member" ? [] : state.ids }),
      // Restored by CartSync after hydration, so server and first client render match.
      skipHydration: true,
    },
  ),
);
