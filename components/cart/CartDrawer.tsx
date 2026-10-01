"use client";

import { X } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { useCartStore } from "@/lib/stores/cart";
import { CartContents } from "./CartContents";

// Slide-out cart from the right (CLAUDE.md §8 — the primary cart UI; /cart is the full page).
export function CartDrawer() {
  const open = useCartStore((s) => s.open);
  const closeCart = useCartStore((s) => s.closeCart);
  const count = useCartStore((s) => s.lines.length);

  return (
    <Sheet
      open={open}
      onClose={closeCart}
      label="Cart"
      side="right"
      className="w-[min(92vw,28rem)]"
    >
      <div className="flex h-full flex-col">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 md:px-6">
          <p className="font-display text-lg font-bold">
            Your cart{count > 0 ? ` (${count})` : ""}
          </p>
          <button
            type="button"
            onClick={closeCart}
            autoFocus
            className="-mr-2 inline-flex size-10 items-center justify-center rounded-md hover:bg-surface"
          >
            <X aria-hidden className="size-5" />
            <span className="sr-only">Close cart</span>
          </button>
        </div>
        {open ? <CartContents variant="drawer" /> : null}
      </div>
    </Sheet>
  );
}
