import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingView } from "@/components/catalogue/ListingView";
import { ChipLink } from "@/components/ui/ChipLink";
import { PAGE_SIZE, parseFilters } from "@/lib/catalogue/filters";
import { getCategoryPage, getFacets, listProducts } from "@/lib/server/catalogue";

const ROOT_LANDINGS = new Set(["men", "women", "unisex"]);

export async function generateMetadata({ params }: PageProps<"/c/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryPage(slug);
  if (!category) return {};
  const { parent } = category;
  // "Men's jackets" under a gender; "Jackets: Bomber" one level further down.
  const underGender = parent && ROOT_LANDINGS.has(parent.slug);
  const title = !parent
    ? `All ${category.name.toLowerCase()}`
    : underGender
      ? `${parent.name}'s ${category.name.toLowerCase()}`
      : `${parent.name}: ${category.name}`;
  const scope = !parent
    ? category.name.toLowerCase()
    : underGender
      ? `${category.name.toLowerCase()} for ${parent.name.toLowerCase()}`
      : `${parent.name.toLowerCase()} — ${category.name.toLowerCase()}`;
  return {
    title,
    description: `Pre-loved ${scope}: one-of-one pieces, graded and measured.`,
    alternates: { canonical: `/c/${slug}` },
  };
}

// Category listing (PLP). Filters, sort and page all come from the URL, so the page renders on the
// server for every request and any filtered view can be shared as a link.
export default async function CategoryListingPage({
  params,
  searchParams,
}: PageProps<"/c/[slug]">) {
  const [{ slug }, raw] = await Promise.all([params, searchParams]);
  const category = await getCategoryPage(slug);
  if (!category) notFound();

  const filters = { ...parseFilters(raw), categories: [] };
  const pathname = `/c/${slug}`;
  const [{ products, total }, facets] = await Promise.all([
    listProducts({ ...filters, categoryIds: category.ids, limit: filters.page * PAGE_SIZE }),
    getFacets({ categoryIds: category.ids, q: "" }),
  ]);

  // Gender roots have their own landing page; every other category is a listing.
  const hrefFor = (c: { slug: string }) =>
    ROOT_LANDINGS.has(c.slug) ? `/${c.slug}` : `/c/${c.slug}`;
  const breadcrumbs = [
    { label: "Home", href: "/" },
    ...(category.parent
      ? [
          ...category.ancestors.map((a) => ({ label: a.name, href: hrefFor(a) })),
          { label: category.name },
        ]
      : [
          ...(ROOT_LANDINGS.has(category.slug)
            ? [{ label: category.name, href: hrefFor(category) }]
            : []),
          { label: "Shop all" },
        ]),
  ];

  // Sub-category links: children of a category that has them, or siblings of a sub-category.
  const { hub } = category;
  const subnav = (
    <nav aria-label={`${hub.name} categories`} className="-mx-4 mt-5 overflow-x-auto px-4">
      <ul className="flex w-max gap-2">
        {[{ slug: hub.slug, name: `All ${hub.name.toLowerCase()}` }, ...category.children].map(
          (link) => {
            const current = link.slug === category.slug;
            return (
              <li key={link.slug}>
                <ChipLink href={`/c/${link.slug}`} aria-current={current ? "page" : undefined}>
                  {link.name}
                </ChipLink>
              </li>
            );
          },
        )}
      </ul>
    </nav>
  );

  return (
    <ListingView
      pathname={pathname}
      eyebrow={category.parent?.name}
      title={category.parent ? category.name : `All ${category.name.toLowerCase()}`}
      breadcrumbs={breadcrumbs}
      intro={subnav}
      filters={filters}
      facets={facets}
      products={products}
      total={total}
    />
  );
}
