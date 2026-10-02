import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/SiteShell";
import { SearchForm } from "@/components/layout/SearchForm";
import { ButtonLink } from "@/components/ui/ButtonLink";
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
            <ButtonLink href="/">Back to home</ButtonLink>
          </li>
          {genderNav.map((item) => (
            <li key={item.gender}>
              <ButtonLink href={item.href} variant="outline">
                Shop {item.label.toLowerCase()}
              </ButtonLink>
            </li>
          ))}
        </ul>
      </div>
    </SiteShell>
  );
}
