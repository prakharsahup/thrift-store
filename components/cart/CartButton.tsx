"use client";

import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/lib/stores/cart";
import { cn } from "@/lib/utils/cn";

type Props = { className?: string };

// Header cart icon with a live count. Opens the drawer.
export function CartButton({ className }: Props) {
  const count = useCartStore((s) => s.lines.length);
  const open = useCartStore((s) => s.open);
  const openCart = useCartStore((s) => s.openCart);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={openCart}
      aria-haspopup="dialog"
      aria-expanded={open}
      className={cn("relative", className)}
    >
      <ShoppingBag aria-hidden />
      {count > 0 ? (
        <span
          aria-hidden
          className="absolute top-1 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-xs leading-none font-bold tracking-normal text-primary-fg"
        >
          {count}
        </span>
      ) : null}
      <span className="sr-only">
        Cart, {count} {count === 1 ? "item" : "items"}
      </span>
    </Button>
  );
}
