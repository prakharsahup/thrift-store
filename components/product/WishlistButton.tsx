"use client";

import { Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useWishlistToggle } from "@/hooks/useWishlistToggle";
import { cn } from "@/lib/utils/cn";

type Props = { productId: string; className?: string };

// PDP "Save to wishlist". Signed-out visitors are sent to sign in and brought back here.
export function WishlistButton({ productId, className }: Props) {
  const { saved, error, toggle } = useWishlistToggle(productId);

  return (
    <div className={className}>
      <Button
        variant="outline"
        size="lg"
        fullWidth
        aria-pressed={saved}
        onClick={() => void toggle()}
      >
        <Heart aria-hidden className={cn(saved && "fill-primary text-accent")} />
        {saved ? "Saved to wishlist" : "Save to wishlist"}
      </Button>
      {error ? (
        <p role="alert" className="mt-2 text-xs text-sale">
          That didn&rsquo;t save. Try again.
        </p>
      ) : null}
    </div>
  );
}
