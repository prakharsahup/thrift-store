import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BrandLink } from "@/lib/server/catalogue";

type Props = { brands: BrandLink[] };

// Panel for the Brand tab: every brand with a few pieces on the rack, biggest first. Each link is
// the search page filtered to that brand, so it shows all of that brand's pieces.
export function BrandPanel({ brands }: Props) {
  return (
    <nav aria-label="Brands" className="site-container py-10">
      <p className="text-xs font-bold tracking-widest text-muted uppercase">
        Brands with the most pieces
      </p>
      {brands.length > 0 ? (
        <ul className="mt-4 columns-2 gap-x-6 sm:columns-3 lg:columns-5">
          {brands.map((brand) => (
            <li key={brand.name} className="break-inside-avoid">
              <Link
                href={brand.href}
                className="group flex items-baseline justify-between gap-3 border-b border-border py-2 text-sm font-semibold hover:text-accent"
              >
                <span className="truncate">{brand.name}</span>
                <span className="shrink-0 text-xs text-muted tabular-nums group-hover:text-accent">
                  {brand.count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted">Brands appear here once a few pieces are listed.</p>
      )}
      <Link
        href="/search?sort=newest"
        className="mt-8 inline-flex items-center gap-2 text-xs font-bold tracking-widest text-accent uppercase hover:text-fg"
      >
        Search every brand <ArrowRight aria-hidden className="size-4" />
      </Link>
    </nav>
  );
}
