import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BrandLink } from "@/lib/server/catalogue";

type Props = {
  id: string;
  brands: readonly BrandLink[];
  open: boolean;
  onNavigate: () => void;
};

// The Brand tab's panel: every brand with a few pieces on the rack, biggest first. Each link is the
// search page filtered to that brand. Same shell and fade as MegaMenuPanel.
export function BrandMenuPanel({ id, brands, open, onNavigate }: Props) {
  return (
    <div
      id={id}
      data-open={open}
      className="pointer-events-none invisible absolute inset-x-0 top-full -translate-y-1 border-b border-border bg-bg opacity-0 transition-[opacity,translate,visibility] duration-200 data-[open=true]:pointer-events-auto data-[open=true]:visible data-[open=true]:translate-y-0 data-[open=true]:opacity-100"
    >
      <div className="site-container py-8">
        <Link
          href="/search?sort=newest"
          onClick={onNavigate}
          className="mb-6 inline-flex items-center gap-2 font-display text-lg font-bold hover:text-primary"
        >
          Shop all brands
          <ArrowRight aria-hidden className="size-4" />
        </Link>
        <p
          id={`${id}-heading`}
          className="mb-3 text-xs font-semibold tracking-wider text-muted uppercase"
        >
          Brands with the most pieces
        </p>
        {brands.length > 0 ? (
          <ul aria-labelledby={`${id}-heading`} className="columns-3 gap-x-8 xl:columns-5">
            {brands.map((brand) => (
              <li key={brand.name} className="break-inside-avoid">
                <Link
                  href={brand.href}
                  onClick={onNavigate}
                  className="group flex items-baseline justify-between gap-3 py-1 text-sm hover:text-primary"
                >
                  <span className="truncate group-hover:underline">{brand.name}</span>
                  <span className="shrink-0 text-xs text-muted tabular-nums">{brand.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Brands appear here once a few pieces are listed.</p>
        )}
      </div>
    </div>
  );
}
