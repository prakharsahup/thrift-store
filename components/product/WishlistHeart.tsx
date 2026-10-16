"use client";

import { Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useWishlistToggle } from "@/hooks/useWishlistToggle";
import { cn } from "@/lib/utils/cn";

type Props = { productId: string; title: string; className?: string };

// Heart on product cards. Same behaviour as the PDP button (useWishlistToggle): guests go to sign
// in and come back to this page. The accessible name stays fixed; aria-pressed carries the state.
export function WishlistHeart({ productId, title, className }: Props) {
  const { saved, error, toggle } = useWishlistToggle(productId);

  return (
    <div className={cn("flex flex-col items-end gap-1", className)}>
      <Button
        variant="overlay"
        size="icon-sm"
        shape="round"
        aria-pressed={saved}
        onClick={() => void toggle()}
        // 36px to look at, 44px to tap: the invisible ::after widens the touch target.
        className="relative after:absolute after:-inset-1 after:content-['']"
      >
        <Heart aria-hidden className={cn(saved && "fill-primary text-accent")} />
        <span className="sr-only">Save {title} to wishlist</span>
      </Button>
      {error ? (
        <p role="alert" className="rounded-sm bg-bg px-2 py-1 text-xs text-sale shadow-sm">
          Didn&rsquo;t save. Try again.
        </p>
      ) : null}
    </div>
  );
}
