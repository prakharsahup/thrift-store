import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/layout/SiteShell";
import { SearchForm } from "@/components/layout/SearchForm";
import { genderNav } from "@/lib/config/navigation";

export const metadata: Metadata = { title: "Page not found" };

// Renders inside the root layout only, so it brings its own storefront chrome.
export default function NotFound() {
  return (
    <SiteShell>
      <div className="site-container py-16 md:py-24">
        <p className="text-xs font-semibold tracking-widest text-muted uppercase">Error 404</p>
        <h1 className="mt-3 text-2xl font-bold md:text-4xl">This one&rsquo;s already gone.</h1>
        <p className="mt-4 max-w-prose text-base text-muted">
          We couldn&rsquo;t find that page. It may have moved, or the link has a typo. Try a search,
          or pick up from one of these:
        </p>

        <SearchForm id="not-found-search" className="mt-8 max-w-md" />

        <ul className="mt-8 flex flex-wrap gap-3">
          <li>
            <Link
              href="/"
              className="inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-fg"
            >
              Back to home
            </Link>
          </li>
          {genderNav.map((item) => (
            <li key={item.gender}>
              <Link
                href={item.href}
                className="inline-flex h-11 items-center rounded-md border border-fg px-5 text-sm font-semibold"
              >
                Shop {item.label.toLowerCase()}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </SiteShell>
  );
}
