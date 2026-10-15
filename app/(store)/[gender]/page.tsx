import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ProductGrid } from "@/components/catalogue/ProductGrid";
import { ProductRail } from "@/components/home/ProductRail";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { HoverMarquee } from "@/components/motion/HoverMarquee";
import { ProductCard } from "@/components/product/ProductCard";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ChipLink } from "@/components/ui/ChipLink";
import { stealsMaxPaise } from "@/lib/config/home";
import { genders, styleTags, type Gender } from "@/lib/config/navigation";
import { getCategoryPage, listProducts, type ProductQuery } from "@/lib/server/catalogue";
import { formatMoney } from "@/lib/utils/money";

// Only /men, /women and /unisex exist; any other top-level path falls through to the 404 page.
export const dynamicParams = false;
export const revalidate = 60;

export function generateStaticParams() {
  return genders.map((gender) => ({ gender }));
}

const intros: Record<Gender, string> = {
  men: "Broken-in denim, proper workwear and vintage sportswear — every piece graded and measured.",
  women: "Slip dresses, tailored trousers and Y2K finds — one of each, with every flaw shown.",
  unisex: "Oversized everything: hoodies, jackets, track pants and the accessories to match.",
};

function isGender(value: string): value is Gender {
  return (genders as readonly string[]).includes(value);
}

export async function generateMetadata({ params }: PageProps<"/[gender]">): Promise<Metadata> {
  const { gender } = await params;
  if (!isGender(gender)) return {};
  const name = gender.charAt(0).toUpperCase() + gender.slice(1);
  return { title: `${name}'s pre-loved fashion`, description: intros[gender] };
}

const GRID_EMPTY = (
  <p className="text-sm text-muted">New pieces are on their way. Check back soon.</p>
);
const RAIL_SIZES =
  "(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 46vw";

/** An unfiltered, newest-first query over some categories. */
function browse(categoryIds: string[], extra: Partial<ProductQuery>): ProductQuery {
  return {
    q: "",
    sizes: [],
    conditions: [],
    brands: [],
    styles: [],
    minRupees: null,
    maxRupees: null,
    sort: "newest",
    categoryIds,
    limit: 8,
    ...extra,
  };
}

// Gender landing (/men, /women, /unisex): category links, the newest pieces, style shortcuts and
// a steals rail. Light motion only — it's a shopping page.
export default async function GenderLandingPage({ params }: PageProps<"/[gender]">) {
  const { gender } = await params;
  if (!isGender(gender)) notFound();
  const root = await getCategoryPage(gender);
  if (!root) notFound();

  const [newest, steals] = await Promise.all([
    // 12 fills whole rows at 2, 3 and 4 columns; ProductGrid trims if fewer come back.
    listProducts(browse(root.ids, { limit: 12 })),
    listProducts(browse(root.ids, { maxRupees: stealsMaxPaise / 100, limit: 12 })),
  ]);
  const buyableSteals = steals.products.filter((p) => p.status !== "sold");

  return (
    <div className="site-container py-6 md:py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: root.name }]} />

      <header className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold md:text-4xl">{root.name}</h1>
          <p className="mt-3 text-base text-muted md:text-lg">{intros[gender]}</p>
        </div>
        <HoverMarquee href={`/c/${root.slug}`} label={`Shop all ${root.name.toLowerCase()}`} />
      </header>

      <nav aria-label={`${root.name} categories`} className="mt-8">
        <ul className="flex flex-wrap gap-2">
          {root.children.map((child) => (
            <li key={child.slug}>
              <ChipLink href={`/c/${child.slug}`}>{child.name}</ChipLink>
            </li>
          ))}
        </ul>
      </nav>

      <section aria-labelledby="landing-new" className="mt-12 md:mt-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 id="landing-new" className="text-xl font-bold md:text-2xl">
            New in {root.name.toLowerCase()}
          </h2>
          <ButtonLink href={`/c/${root.slug}?sort=newest`} variant="link">
            See everything <ArrowRight aria-hidden />
          </ButtonLink>
        </div>
        <ProductGrid
          products={newest.products}
          total={newest.products.length}
          loadMoreHref={null}
          emptyState={GRID_EMPTY}
          fullRowsOnly
        />
      </section>

      <section aria-labelledby="landing-styles" className="mt-16">
        <h2 id="landing-styles" className="mb-6 text-xl font-bold md:text-2xl">
          Shop by style
        </h2>
        <ul className="flex flex-wrap gap-2">
          {styleTags.map(([label, tag]) => (
            <li key={tag}>
              <ChipLink href={`/c/${root.slug}?style=${tag}`}>{label}</ChipLink>
            </li>
          ))}
        </ul>
      </section>

      {buyableSteals.length > 0 ? (
        <section aria-labelledby="landing-steals" className="mt-16">
          <h2 id="landing-steals" className="mb-6 text-xl font-bold md:text-2xl">
            Under {formatMoney(stealsMaxPaise)}
          </h2>
          <ProductRail label={`${root.name} under ${formatMoney(stealsMaxPaise)}`}>
            {buyableSteals.map((product) => (
              <ProductCard key={product.id} product={product} sizes={RAIL_SIZES} />
            ))}
          </ProductRail>
        </section>
      ) : null}
    </div>
  );
}
