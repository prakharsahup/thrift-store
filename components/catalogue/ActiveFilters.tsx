import Link from "next/link";
import { X } from "lucide-react";
import type { ActiveFilter } from "@/lib/catalogue/filters";

type Props = {
  chips: ActiveFilter[];
  /** Same listing with every filter removed. */
  clearHref: string;
};

// Removable chips for the filters in the URL — each is a link, so it works without JavaScript.
export function ActiveFilters({ chips, clearHref }: Props) {
  if (chips.length === 0) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <p className="sr-only">Active filters</p>
      <ul className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <li key={chip.key}>
            <Link
              href={chip.href}
              scroll={false}
              className="inline-flex h-8 items-center gap-1 rounded-full bg-surface pr-2 pl-3 text-xs font-medium hover:bg-border"
            >
              {chip.label}
              <X aria-hidden className="size-3.5" />
              <span className="sr-only">(remove filter)</span>
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href={clearHref}
        scroll={false}
        className="text-xs font-semibold text-primary underline"
      >
        Clear all
      </Link>
    </div>
  );
}
