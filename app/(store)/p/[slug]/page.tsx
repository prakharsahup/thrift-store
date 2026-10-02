import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Info } from "lucide-react";
import { ProductRail } from "@/components/home/ProductRail";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { WishlistButton } from "@/components/product/WishlistButton";
import { ConditionBadge } from "@/components/product/ConditionBadge";
import { Gallery } from "@/components/product/Gallery";
import { MeasurementsTable } from "@/components/product/MeasurementsTable";
import { ProductCard } from "@/components/product/ProductCard";
import { ChipLink } from "@/components/ui/ChipLink";
import { styleTags } from "@/lib/config/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/server/catalogue";
import { formatINR, savingPercent } from "@/lib/utils/money";

// Cached per product and refreshed at most once a minute. The checkout phase also revalidates a
// product's page the moment it sells.
export const revalidate = 60;

// No product pages are built ahead of time; each is rendered on its first visit, then cached.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/p/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const price = formatINR(product.pricePaise);
  return {
    title: `${product.title}${product.brand ? ` · ${product.brand}` : ""}`,
    description:
      `${product.status === "sold" ? "Sold. " : ""}${price} — ${product.description}`.slice(0, 160),
    alternates: { canonical: `/p/${slug}` },
    openGraph: {
      images: product.images[0] ? [{ url: product.images[0].url, alt: product.images[0].alt }] : [],
    },
  };
}

const RELATED_SIZES =
  "(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 46vw";
const styleLabel = new Map<string, string>(styleTags.map(([label, tag]) => [tag, label]));

// Product detail page (CLAUDE.md §8). Sold items keep this page (with a SOLD state) forever.
export default async function ProductPage({ params }: PageProps<"/p/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product);
  const saving = product.originalPricePaise
    ? savingPercent(product.pricePaise, product.originalPricePaise)
    : 0;
  const parent = product.category?.parent;

  return (
    <div className="site-container py-6 md:py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          ...(parent ? [{ label: parent.name, href: `/${parent.slug}` }] : []),
          ...(product.category
            ? [{ label: product.category.name, href: `/c/${product.category.slug}` }]
            : []),
          { label: product.title },
        ]}
      />

      <div className="mt-6 grid gap-8 lg:grid-cols-[7fr_5fr] lg:gap-12">
        <Gallery images={product.images} title={product.title} />

        <div className="lg:sticky lg:top-24 lg:self-start">
          {/* Hierarchy: brand 12 caps → title 24/32 → price 18/24 → meta 14. */}
          {product.brand ? (
            <Link
              href={`/search?brand=${encodeURIComponent(product.brand)}`}
              className="text-xs font-semibold tracking-wider text-primary uppercase hover:underline"
            >
              {product.brand}
            </Link>
          ) : (
            <p className="text-xs font-semibold tracking-wider text-muted uppercase">Unbranded</p>
          )}
          <h1 className="mt-2 text-xl font-semibold tracking-tight font-stretch-normal lg:text-2xl">
            {product.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="font-body text-lg font-bold tabular-nums lg:text-xl">
              {formatINR(product.pricePaise)}
            </p>
            {product.originalPricePaise ? (
              <p className="text-sm text-muted">
                est. retail <s>{formatINR(product.originalPricePaise)}</s>
                {saving > 0 ? (
                  <span className="ml-2 font-semibold text-sale">You save {saving}%</span>
                ) : null}
              </p>
            ) : null}
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-4 border-y border-border py-4 text-sm">
            <div>
              <dt className="text-muted">Tagged size</dt>
              <dd className="mt-0.5 font-semibold">{product.taggedSize ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Availability</dt>
              <dd className="mt-0.5 font-semibold">
                {product.status === "sold"
                  ? "Sold"
                  : product.status === "reserved"
                    ? "On hold"
                    : "Only one available"}
              </dd>
            </div>
          </dl>

          <ConditionBadge condition={product.condition} className="mt-4" />

          <div className="mt-6 grid gap-3">
            <AddToCartButton
              line={{
                productId: product.id,
                slug: product.slug,
                title: product.title,
                brand: product.brand,
                taggedSize: product.taggedSize,
                pricePaise: product.pricePaise,
                imageUrl: product.images[0]?.url ?? null,
                status: product.status,
              }}
            />
            <WishlistButton productId={product.id} />
          </div>

          <p className="mt-4 flex gap-2 text-xs text-muted">
            <Info aria-hidden className="size-4 shrink-0" />
            One of one: there&rsquo;s exactly one of this piece. Adding it to your cart
            doesn&rsquo;t hold it — it&rsquo;s reserved for you for 15 minutes once you start
            checkout.
          </p>

          <section aria-labelledby="pdp-measurements" className="mt-8">
            <h2 id="pdp-measurements" className="text-base font-bold font-stretch-normal">
              Measurements
            </h2>
            <div className="mt-3">
              <MeasurementsTable
                measurements={product.measurements}
                taggedSize={product.taggedSize}
              />
            </div>
          </section>

          <section aria-labelledby="pdp-flaws" className="mt-8">
            <h2 id="pdp-flaws" className="text-base font-bold font-stretch-normal">
              Flaws
            </h2>
            <p className="mt-2 text-sm text-muted">
              {product.flaws ??
                "None we could find. If anything turns up, it'll be photographed above."}
            </p>
          </section>

          <section aria-labelledby="pdp-description" className="mt-8">
            <h2 id="pdp-description" className="text-base font-bold font-stretch-normal">
              Description
            </h2>
            <p className="mt-2 text-sm leading-relaxed">{product.description}</p>
            {product.styleTags.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Styles">
                {product.styleTags.map((tag) => (
                  <li key={tag}>
                    <ChipLink href={`/search?style=${tag}`} size="sm">
                      {styleLabel.get(tag) ?? tag}
                    </ChipLink>
                  </li>
                ))}
              </ul>
            ) : null}
            {product.drop ? (
              <p className="mt-4 text-sm">
                Part of the{" "}
                <Link
                  href={`/drops/${product.drop.slug}`}
                  className="font-semibold text-primary underline"
                >
                  {product.drop.name}
                </Link>{" "}
                drop.
              </p>
            ) : null}
          </section>
        </div>
      </div>

      {related.length > 0 ? (
        <section aria-labelledby="pdp-related" className="mt-16 md:mt-24">
          <h2 id="pdp-related" className="mb-6 text-xl font-bold lg:text-2xl">
            You may also like
          </h2>
          <ProductRail label="You may also like">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} sizes={RELATED_SIZES} />
            ))}
          </ProductRail>
        </section>
      ) : null}
    </div>
  );
}
