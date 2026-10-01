import { create } from "zustand";
import { loadWishlistIds, setWishlisted } from "@/lib/actions/wishlist";

// Which products the signed-in user has saved, so heart buttons on cached pages can show their
// state. Loaded by CartSync when a session starts.

type WishlistState = {
  ids: string[];
  /** "unknown" until the first auth check finishes. */
  session: "unknown" | "guest" | "member";
  load: () => Promise<void>;
  reset: () => void;
  /** Returns "login" when the visitor has to sign in first. */
  toggle: (productId: string) => Promise<"ok" | "login" | "error">;
};

export const useWishlistStore = create<WishlistState>()((set, get) => ({
  ids: [],
  session: "unknown",

  load: async () => {
    const result = await loadWishlistIds();
    if (result.ok) set({ ids: result.data, session: "member" });
  },

  reset: () => set({ ids: [], session: "guest" }),

  toggle: async (productId) => {
    const saved = !get().ids.includes(productId);
    const previous = get().ids;
    set({ ids: saved ? [...previous, productId] : previous.filter((id) => id !== productId) });
    const result = await setWishlisted(productId, saved);
    if (result.ok) return "ok";
    set({ ids: previous });
    return result.needsLogin ? "login" : "error";
  },
}));
