import type { Metadata } from "next";
import { ListingView } from "@/components/catalogue/ListingView";
import { SearchForm } from "@/components/layout/SearchForm";
import { PAGE_SIZE, parseFilters } from "@/lib/catalogue/filters";
import { getCategoryGroups, getFacets, listProducts } from "@/lib/server/catalogue";

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const { q } = parseFilters(await searchParams);
  return {
    title: q ? `Search: ${q}` : "Search",
    // Result pages shouldn't be indexed; the catalogue is indexed through category and product URLs.
    robots: { index: false, follow: true },
  };
}

// Search (CLAUDE.md §8): Postgres full-text search over title, brand, tags and description, with
// the same filters and sorting as category pages, plus a Men / Women / Unisex filter.
export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const filters = parseFilters(await searchParams);
  const groups = await getCategoryGroups();
  const selected = groups.filter((g) => filters.categories.includes(g.slug));
  const categoryIds = selected.length ? selected.flatMap((g) => g.ids) : null;

  const [{ products, total }, facets] = await Promise.all([
    listProducts({ ...filters, categoryIds, limit: filters.page * PAGE_SIZE }),
    getFacets({ categoryIds: null, q: filters.q }),
  ]);

  return (
    <ListingView
      pathname="/search"
      eyebrow={filters.q ? "Search results" : undefined}
      title={filters.q ? `“${filters.q}”` : "Shop everything"}
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Search" }]}
      intro={
        <SearchForm id="search-page-input" defaultValue={filters.q} className="mt-5 max-w-xl" />
      }
      filters={filters}
      facets={facets}
      products={products}
      total={total}
      categoryOptions={groups.map((g) => ({ slug: g.slug, name: g.name }))}
    />
  );
}
