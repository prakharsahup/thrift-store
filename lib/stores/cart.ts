import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  addToAccountCart,
  getCartLines,
  loadAccountCart,
  mergeGuestCart,
  removeFromAccountCart,
} from "@/lib/actions/cart";
import type { CartLine } from "@/lib/cart/types";

// Cart state for the drawer, header badge and cart page (CLAUDE.md §3: zustand for the cart only).
//
// Signed out ("guest"): lines live here and are persisted to localStorage.
// Signed in ("account"): lines are stored in the database (cart_items); this store mirrors them.
// On sign-in the guest cart is merged into the account (CartSync calls signedIn).
//
// Prices shown here are for display. Checkout recomputes everything on the server.

type CartState = {
  lines: CartLine[];
  mode: "guest" | "account";
  userId: string | null;
  open: boolean;
  /** False until the cart is known (restored from the browser, or loaded for the account). */
  ready: boolean;
  /** Last error to show in the drawer, if any. */
  error: string | null;
  add: (line: CartLine) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  /** Opens the drawer and re-reads prices/availability. */
  openCart: () => void;
  /** Opens the drawer without re-reading (right after adding, when the data is already fresh). */
  showCart: () => void;
  closeCart: () => void;
  /** Re-reads prices and availability (called whenever the cart is opened). */
  refresh: () => Promise<void>;
  signedIn: (userId: string) => Promise<void>;
  signedOut: () => void;
  markReady: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      mode: "guest",
      userId: null,
      open: false,
      ready: false,
      error: null,

      add: async (line) => {
        if (get().lines.some((l) => l.productId === line.productId)) return;
        const previous = get().lines;
        set({ lines: [...previous, line], error: null });
        if (get().mode === "account") {
          const result = await addToAccountCart(line.productId);
          if (!result.ok) set({ lines: previous, error: result.message });
        }
      },

      remove: async (productId) => {
        const previous = get().lines;
        set({ lines: previous.filter((l) => l.productId !== productId), error: null });
        if (get().mode === "account") {
          const result = await removeFromAccountCart(productId);
          if (!result.ok) set({ lines: previous, error: result.message });
        }
      },

      openCart: () => {
        set({ open: true });
        void get().refresh();
      },

      showCart: () => set({ open: true }),

      closeCart: () => set({ open: false }),

      refresh: async () => {
        const { mode, lines } = get();
        if (mode === "guest" && lines.length === 0) return;
        const result =
          mode === "account"
            ? await loadAccountCart()
            : await getCartLines(lines.map((l) => l.productId));
        // Ignore a stale answer: the user signed in or out, or removed lines, while we waited.
        if (!result.ok || get().mode !== mode) return;
        const current = new Set(get().lines.map((l) => l.productId));
        set({
          lines:
            mode === "guest" ? result.data.filter((l) => current.has(l.productId)) : result.data,
        });
      },

      signedIn: async (userId) => {
        const { mode, lines } = get();
        if (mode === "account" && get().userId === userId) return;
        const guestIds = mode === "guest" ? lines.map((l) => l.productId) : [];
        const result = await mergeGuestCart(guestIds);
        if (result.ok) set({ mode: "account", userId, lines: result.data, error: null });
        set({ ready: true });
      },

      signedOut: () => set({ mode: "guest", userId: null, lines: [], error: null, ready: true }),

      markReady: () => set({ ready: true }),
    }),
    {
      name: "cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Only a guest cart is stored in the browser; an account cart lives in the database.
      partialize: (state) => ({ lines: state.mode === "guest" ? state.lines : [] }),
      // Hydrated by CartSync after mount, so server and first client render match (empty cart).
      skipHydration: true,
      // A restored guest cart may be stale (sold items, price edits): re-read it straight away.
      onRehydrateStorage: () => (state) => {
        if (state && state.mode === "guest" && state.lines.length > 0) void state.refresh();
      },
    },
  ),
);
