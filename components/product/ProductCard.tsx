import Image from "next/image";
import Link from "next/link";
import { conditions } from "@/lib/config/conditions";
import type { ProductCardData } from "@/lib/server/catalogue";
import { cn } from "@/lib/utils/cn";
import { formatINR, savingPercent } from "@/lib/utils/money";

type Props = {
  product: ProductCardData;
  /** next/image `sizes` for the grid or rail this card sits in. */
  sizes: string;
  className?: string;
};

// Product card (CLAUDE.md §5, MOTION.md §5.10). CSS-only hover: the second image crossfades in over
// 0.4s and the details lift 8px. Tailwind's hover: only applies on devices that can hover.
export function ProductCard({ product, sizes, className }: Props) {
  const [front, back] = product.images;
  const sold = product.status === "sold";
  const saving = product.originalPricePaise
    ? savingPercent(product.pricePaise, product.originalPricePaise)
    : 0;

  return (
    <Link href={`/p/${product.slug}`} className={cn("group block", className)}>
      <span className="relative block aspect-[3/4] overflow-hidden rounded-md bg-surface">
        {front ? (
          <Image
            src={front.url}
            alt={front.alt || product.title}
            fill
            sizes={sizes}
            className={cn("object-cover", sold && "opacity-60")}
          />
        ) : null}
        {back && !sold ? (
          <Image
            src={back.url}
            alt=""
            fill
            sizes={sizes}
            className="object-cover opacity-0 transition-opacity duration-400 group-hover:opacity-100 group-focus-visible:opacity-100"
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
        ) : saving >= 50 ? (
          <span className="absolute top-2 left-2 rounded-sm bg-accent px-2 py-1 text-xs font-bold text-accent-fg">
            {saving}% off retail
          </span>
        ) : null}
      </span>

      <span className="block transition-transform duration-400 group-hover:-translate-y-2 group-focus-visible:-translate-y-2">
        <span className="mt-3 block truncate text-xs text-muted">
          {[
            product.brand,
            product.taggedSize && `Size ${product.taggedSize}`,
            conditions[product.condition].label,
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
        <span className="mt-0.5 block truncate text-sm font-medium">{product.title}</span>
        <span className="mt-1 flex items-baseline gap-2 text-sm">
          <span className="font-bold">{formatINR(product.pricePaise)}</span>
          {product.originalPricePaise ? (
            <span className="text-xs text-muted">
              <span className="sr-only">Estimated retail </span>
              <s>{formatINR(product.originalPricePaise)}</s>
            </span>
          ) : null}
        </span>
      </span>
    </Link>
  );
}
