import Image from "next/image";
import Link from "next/link";
import { Price } from "@/components/currency/Price";
import type { ProductCardData } from "@/lib/server/catalogue";
import { cn } from "@/lib/utils/cn";

type Props = {
  id: string;
  title: string;
  pieces: ProductCardData[];
  /** How many pieces to show (the archive shows a whole drop). */
  limit?: number;
  /** Line on the right of the heading. */
  aside?: string;
};

// Uneven grid on bone (Drop Night "Last drop"): the first piece runs two rows tall and the fifth
// runs two columns wide, so the section reads like a pinned-up contact sheet, not a product grid.
function tileClass(i: number, uneven: boolean) {
  if (!uneven) return "";
  if (i === 0) return "md:row-span-2";
  if (i === 4) return "md:col-span-2";
  return "";
}

// "Last drop — …" / "Recently claimed": what went, and how fast. Claimed pieces turn greyscale
// under a purple sticker; anything still available keeps its colour and price.
export function ClaimedGrid({
  id,
  title,
  pieces,
  limit = 8,
  aside = "pehle aao, pehle pao.",
}: Props) {
  // The tall and wide tiles only make sense once there are enough pieces for two rows.
  const uneven = pieces.length >= 5;
  return (
    <section aria-labelledby={id} className="border-t border-border">
      <div className="site-container py-14 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <h2 id={id} className="text-2xl font-bold md:text-3xl">
            {title}
          </h2>
          <p className="text-sm text-muted">{aside}</p>
        </div>

        <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-6 md:mt-10 md:grid-cols-6">
          {pieces.slice(0, limit).map((piece, i) => {
            const claimed = piece.status === "sold";
            const image = piece.images[0];
            return (
              <li key={piece.id} className={cn("flex flex-col", tileClass(i, uneven))}>
                <Link href={`/p/${piece.slug}`} className="group flex flex-1 flex-col">
                  <span
                    className={cn(
                      "relative block overflow-hidden rounded-md bg-surface",
                      uneven && i === 0
                        ? "aspect-[4/5] md:aspect-auto md:min-h-64 md:flex-1"
                        : uneven && i === 4
                          ? "aspect-[4/5] md:aspect-[8/5]"
                          : "aspect-[4/5]",
                    )}
                  >
                    {image ? (
                      <Image
                        src={image.url}
                        alt={image.alt || piece.title}
                        fill
                        sizes="(min-width: 768px) 17vw, 50vw"
                        className={cn(
                          "object-cover transition-transform duration-500 group-hover:scale-105",
                          claimed && "grayscale",
                        )}
                      />
                    ) : (
                      <span className="absolute inset-0 bg-surface" />
                    )}
                    {claimed ? (
                      <span className="absolute top-2 left-2 rounded-sm bg-sold px-2 py-1 text-xs font-bold tracking-wider text-fg">
                        SOLD
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-2 flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-semibold group-hover:underline">
                      {piece.title}
                      {piece.taggedSize ? ` · ${piece.taggedSize}` : ""}
                    </span>
                    {claimed ? null : (
                      <Price amountPaise={piece.pricePaise} className="shrink-0 font-bold" />
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
