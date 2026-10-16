import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { activeFilters, filtersHref, PAGE_SIZE, type Filters } from "@/lib/catalogue/filters";
import type { Facets, ProductCardData } from "@/lib/server/catalogue";
import { ActiveFilters } from "./ActiveFilters";
import { FilterForm } from "./FilterForm";
import { FiltersSheet } from "./FiltersSheet";
import { ProductGrid } from "./ProductGrid";
import { SortSelect } from "./SortSelect";

type Props = {
  pathname: string;
  title: string;
  eyebrow?: string;
  breadcrumbs: { label: string; href?: string }[];
  /** Optional row under the title, e.g. sub-category links or a search box. */
  intro?: React.ReactNode;
  filters: Filters;
  facets: Facets;
  products: ProductCardData[];
  total: number;
  categoryOptions?: { slug: string; name: string }[];
};

// Shared layout for category listings and search: title, toolbar (filters + sort), active filter
// chips, a desktop filter sidebar, the grid and "load more". Server-rendered from the URL.
export function ListingView({
  pathname,
  title,
  eyebrow,
  breadcrumbs,
  intro,
  filters,
  facets,
  products,
  total,
  categoryOptions,
}: Props) {
  const styleLabels = Object.fromEntries(facets.styles.map((s) => [s.tag, s.label]));
  const categoryLabels = Object.fromEntries((categoryOptions ?? []).map((c) => [c.slug, c.name]));
  const chips = activeFilters(pathname, filters, {
    styles: styleLabels,
    categories: categoryLabels,
  });
  const clearHref = filtersHref(pathname, {
    ...filters,
    categories: [],
    sizes: [],
    conditions: [],
    brands: [],
    styles: [],
    minRupees: null,
    maxRupees: null,
    page: 1,
  });
  const loadMoreHref =
    products.length < total && filters.page * PAGE_SIZE < total
      ? filtersHref(pathname, { ...filters, page: filters.page + 1 })
      : null;
  // Remount the forms whenever the URL changes, so their checkboxes match it.
  const formKey = filtersHref(pathname, { ...filters, page: 1 });
  const formProps = { action: pathname, filters, facets, categoryOptions };

  return (
    <div className="site-container py-6 md:py-10">
      <Breadcrumbs items={breadcrumbs} />
      <header className="mt-4">
        {eyebrow ? (
          <p className="text-xs font-semibold tracking-widest text-accent uppercase">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 text-2xl font-bold md:text-3xl">{title}</h1>
      </header>
      {intro}

      <div className="mt-6 flex items-center justify-between gap-4 border-y border-border py-3">
        <FiltersSheet key={formKey} {...formProps} activeCount={chips.length} />
        <p className="hidden text-sm text-muted lg:block">
          {total} {total === 1 ? "piece" : "pieces"}
        </p>
        <SortSelect key={`sort-${formKey}`} action={pathname} filters={filters} />
      </div>
      <ActiveFilters chips={chips} clearHref={clearHref} />

      <div className="mt-8 lg:grid lg:grid-cols-[15rem_1fr] lg:gap-10">
        <aside aria-label="Filters" className="hidden lg:block">
          <FilterForm key={formKey} {...formProps} idPrefix="side" autoSubmit />
        </aside>
        <ProductGrid
          products={products}
          total={total}
          loadMoreHref={loadMoreHref}
          emptyState={
            <>
              <p className="font-display text-xl font-bold">Nothing matches that — yet.</p>
              <p className="mt-2 text-sm text-muted">
                New one-of-one pieces land every week. Try fewer filters, or{" "}
                <Link href={clearHref} className="font-semibold text-accent underline">
                  clear them all
                </Link>
                .
              </p>
            </>
          }
        />
      </div>
    </div>
  );
}
