import { SearchForm } from "@/components/layout/SearchForm";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { genderNav } from "@/lib/config/navigation";

// Unknown product links. (Sold pieces never land here — their pages stay up with a SOLD state.)
export default function ProductNotFound() {
  return (
    <div className="site-container py-16 md:py-24">
      <p className="text-xs font-semibold tracking-widest text-muted uppercase">Not found</p>
      <h1 className="mt-3 text-2xl font-bold md:text-3xl">We can&rsquo;t find that piece.</h1>
      <p className="mt-4 max-w-prose text-base text-muted">
        The link may be mistyped, or the item hasn&rsquo;t been listed yet. Search for it, or browse
        what&rsquo;s in the shop now.
      </p>
      <SearchForm id="product-not-found-search" className="mt-8 max-w-md" />
      <ul className="mt-8 flex flex-wrap gap-3">
        {genderNav.map((item) => (
          <li key={item.gender}>
            <ButtonLink href={item.href} variant="outline">
              Shop {item.label.toLowerCase()}
            </ButtonLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
