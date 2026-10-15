"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { CartLine as CartLineData } from "@/lib/cart/types";
import { useCartStore } from "@/lib/stores/cart";
import { cn } from "@/lib/utils/cn";
import { formatMoney } from "@/lib/utils/money";

type Props = { line: CartLineData };

export function CartLine({ line }: Props) {
  const remove = useCartStore((s) => s.remove);
  const closeCart = useCartStore((s) => s.closeCart);
  const unavailable = line.status !== "available";

  return (
    <li className="flex gap-4 py-4">
      <Link
        href={`/p/${line.slug}`}
        onClick={closeCart}
        className="relative block h-24 w-18 shrink-0 overflow-hidden rounded-md bg-surface"
      >
        {line.imageUrl ? (
          <Image
            src={line.imageUrl}
            alt={line.title}
            fill
            sizes="72px"
            className={cn("object-cover", unavailable && "opacity-50")}
          />
        ) : null}
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={`/p/${line.slug}`}
          onClick={closeCart}
          className="block truncate text-sm font-medium hover:underline"
        >
          {line.title}
        </Link>
        <p className="mt-0.5 text-xs text-muted">
          {[line.brand, line.taggedSize && `Size ${line.taggedSize}`].filter(Boolean).join(" · ")}
        </p>
        <p className={cn("mt-1 text-sm font-bold", unavailable && "text-muted line-through")}>
          {formatMoney(line.pricePaise)}
        </p>
        {unavailable ? (
          <p className="mt-1 text-xs font-semibold text-sale">
            {line.status === "sold"
              ? "Sold to someone else — remove to continue."
              : "On hold for another shopper right now."}
          </p>
        ) : null}
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => void remove(line.productId)}
        className="-mt-1 -mr-2"
      >
        <X aria-hidden />
        <span className="sr-only">Remove {line.title}</span>
      </Button>
    </li>
  );
}
