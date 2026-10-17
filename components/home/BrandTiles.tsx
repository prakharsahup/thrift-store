import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { BrandTile } from "@/lib/server/catalogue";

type Props = { tiles: BrandTile[] };

// Shop by brand: the biggest brands on the rack, each tile a photo of that brand's newest piece
// (halftone when there's none yet) linking to the search page pre-filtered to that brand.
export function BrandTiles({ tiles }: Props) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
      {tiles.map((tile) => (
        <li key={tile.name}>
          <Link href={tile.href} className="group block">
            <span className="relative block aspect-[3/4] overflow-hidden bg-surface">
              {tile.imageUrl ? (
                <Image
                  src={tile.imageUrl}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <span className="halftone absolute inset-0" />
              )}
            </span>
            <span className="mt-3 flex items-center justify-between gap-2 font-display text-lg text-accent group-hover:text-fg">
              {tile.name}
              <ArrowUpRight
                aria-hidden
                className="size-5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
