import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { RevealImage } from "@/components/motion/RevealImage";
import type { CategoryTile } from "@/lib/server/catalogue";

type Props = { tiles: CategoryTile[] };

// Gender roots link to their landing pages; sub-categories to their listing.
const hrefFor = (slug: string) =>
  ["men", "women", "unisex"].includes(slug) ? `/${slug}` : `/c/${slug}`;

export function CategoryTiles({ tiles }: Props) {
  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {tiles.map((tile) => (
        <li key={tile.slug}>
          <Link href={hrefFor(tile.slug)} className="group block">
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
                className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
