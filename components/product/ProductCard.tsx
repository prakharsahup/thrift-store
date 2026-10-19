import Link from "next/link";
import { conditions } from "@/lib/config/conditions";
import type { ProductCardData } from "@/lib/server/catalogue";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { cn } from "@/lib/utils/cn";
import { formatMoney } from "@/lib/utils/money";
import { conditionTone } from "./conditionTone";
import { WishlistHeart } from "./WishlistHeart";

type Props = {
  product: ProductCardData;
  /** next/image `sizes` for the grid or rail this card sits in. */
  sizes: string;
  className?: string;
};

// Product card (CLAUDE.md §5, MOTION.md §5.10). CSS-only hover: the second image crossfades in over
// 0.4s and the details lift 8px. Tailwind's hover: only applies on devices that can hover.
// Cards are ~156px wide on a 360px phone, so each fact gets its own line and the condition grade
// never shares a line with text that could push it out. The wishlist heart sits outside the link
// (a button can't live inside an <a>).
export function ProductCard({ product, sizes, className }: Props) {
  const [front, back] = product.images;
  const sold = product.status === "sold";

  return (
    <div className={cn("relative", className)}>
      <Link href={`/p/${product.slug}`} className="group/card block">
        <span className="relative block aspect-[3/4] overflow-hidden rounded-md bg-surface">
          <ImageWithFallback
            src={front?.url}
            alt={front?.alt || product.title}
            fill
            sizes={sizes}
            className={cn("object-cover", sold && "opacity-60")}
          />
          {back && !sold ? (
            <ImageWithFallback
              src={back.url}
              alt=""
              fill
              sizes={sizes}
              className="object-cover opacity-0 transition-opacity duration-400 group-hover/card:opacity-100 group-focus-visible/card:opacity-100"
            />
          ) : null}
          {sold ? (
            <span className="absolute top-2 left-2 rounded-sm bg-sold px-2 py-1 text-xs font-bold tracking-wider text-fg">
              SOLD
            </span>
          ) : product.status === "reserved" ? (
            <span className="absolute top-2 left-2 rounded-sm bg-fg px-2 py-1 text-xs font-semibold text-bg">
              On hold
            </span>
          ) : null}
        </span>

        <span className="block transition-transform duration-400 group-hover/card:-translate-y-2 group-focus-visible/card:-translate-y-2">
          <span className="mt-3 block truncate text-xs font-semibold tracking-wide text-muted uppercase">
            {product.brand ?? "Unbranded"}
          </span>
          <span className="mt-0.5 block truncate text-sm font-medium">{product.title}</span>
          <span className="mt-1 block text-sm font-bold">{formatMoney(product.pricePaise)}</span>
          <span className="mt-2 flex items-center gap-2 text-xs">
            <span
              className={cn(
                "shrink-0 rounded-sm px-1.5 py-0.5 font-semibold",
                conditionTone[product.condition],
              )}
            >
              <span className="sr-only">Condition: </span>
              {conditions[product.condition].label}
            </span>
            {product.taggedSize ? (
              <span className="min-w-0 truncate text-muted">Size {product.taggedSize}</span>
            ) : null}
          </span>
        </span>
      </Link>
      <WishlistHeart
        productId={product.id}
        title={product.title}
        className="absolute top-2 right-2"
      />
    </div>
  );
}
