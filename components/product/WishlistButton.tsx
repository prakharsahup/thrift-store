"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Heart } from "lucide-react";
import { useWishlistStore } from "@/lib/stores/wishlist";
import { cn } from "@/lib/utils/cn";

type Props = { productId: string; className?: string };

// Save / un-save a piece. Signed-out visitors are sent to sign in and brought back here.
export function WishlistButton({ productId, className }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const saved = useWishlistStore((s) => s.ids.includes(productId));
  const session = useWishlistStore((s) => s.session);
  const toggle = useWishlistStore((s) => s.toggle);
  const [error, setError] = useState(false);

  async function handleClick() {
    setError(false);
    if (session === "guest") {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    const result = await toggle(productId);
    if (result === "login") router.push(`/login?next=${encodeURIComponent(pathname)}`);
    if (result === "error") setError(true);
  }

  return (
    <div className={className}>
      <button
        type="button"
        aria-pressed={saved}
        onClick={() => void handleClick()}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border border-border text-sm font-semibold hover:border-fg"
      >
        <Heart aria-hidden className={cn("size-4", saved && "fill-primary text-primary")} />
        {saved ? "Saved to wishlist" : "Save to wishlist"}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-xs text-sale">
          That didn&rsquo;t save. Try again.
        </p>
      ) : null}
    </div>
  );
}
