import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { RevealImage } from "@/components/motion/RevealImage";
import type { BrandTile } from "@/lib/server/catalogue";

type Props = { tiles: BrandTile[] };

// Shop by brand: the biggest brands on the rack, each tile a photo of that brand's newest piece,
// linking to the search page pre-filtered to that brand. Same look as CategoryTiles.
export function BrandTiles({ tiles }: Props) {
  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {tiles.map((tile) => (
        <li key={tile.name}>
          <Link href={tile.href} className="group block">
            {tile.imageUrl ? (
              <RevealImage
                src={tile.imageUrl}
                alt=""
                sizes="(min-width: 1024px) 16vw, (min-width: 768px) 33vw, 50vw"
                className="aspect-[4/5] w-full rounded-md bg-surface"
                imageClassName="transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <span className="block aspect-[4/5] w-full rounded-md bg-surface" />
            )}
            <span className="mt-3 flex items-center justify-between gap-2 font-display font-bold">
              {tile.name}
              <ArrowUpRight
                aria-hidden
                className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
