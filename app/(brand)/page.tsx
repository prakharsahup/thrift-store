import type { Metadata } from "next";
import { CategoryTiles } from "@/components/home/CategoryTiles";
import { DropBanner } from "@/components/home/DropBanner";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { ImpactStats } from "@/components/home/ImpactStats";
import { ProductRail } from "@/components/home/ProductRail";
import { SectionHeading } from "@/components/home/SectionHeading";
import { StyleTiles } from "@/components/home/StyleTiles";
import { TrustStrip } from "@/components/home/TrustStrip";
import { HoverMarquee } from "@/components/motion/HoverMarquee";
import { Marquee } from "@/components/motion/Marquee";
import { MaskedVideo } from "@/components/motion/MaskedVideo";
import { RevealText } from "@/components/motion/RevealText";
import { StackCards } from "@/components/motion/StackCards";
import { ProductCard } from "@/components/product/ProductCard";
import { featuredCategorySlugs, stealsMaxPaise, storyCards } from "@/lib/config/home";
import { styleTags } from "@/lib/config/navigation";
import { site } from "@/lib/config/site";
import {
  getBanners,
  getCategoryTiles,
  getFeaturedDrop,
  getImpactStats,
  getNewArrivals,
  getProductsUnder,
} from "@/lib/server/catalogue";
import { formatINR } from "@/lib/utils/money";

export const metadata: Metadata = {
  title: { absolute: `${site.name} — pre-loved fashion, one of one` },
  description: site.tagline,
};

// Cached and refreshed at most once a minute: new listings and sold badges show up quickly
// without hitting the database on every visit.
export const revalidate = 60;

const RAIL_CARD_SIZES =
  "(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 46vw";

// Home (CLAUDE.md §8 + MOTION.md §6).
export default async function HomePage() {
  const [banners, categoryTiles, newArrivals, steals, drop, stats] = await Promise.all([
    getBanners(),
    getCategoryTiles(featuredCategorySlugs),
    getNewArrivals(12),
    getProductsUnder(stealsMaxPaise, 12),
    getFeaturedDrop(),
    getImpactStats(),
  ]);

  return (
    <>
      {banners.length > 0 ? (
        <HeroCarousel banners={banners} />
      ) : (
        <section className="surface-dark bg-fg py-20 text-bg">
          <div className="site-container">
            <RevealText as="h1" trigger="load" className="max-w-3xl text-3xl font-bold md:text-4xl">
              {site.tagline}
            </RevealText>
          </div>
        </section>
      )}

      <Marquee
        items={[
          "Pre-loved denim",
          "Vintage tees",
          ...styleTags.map(([label]) => `${label} finds`),
          "One of one",
          "Graded & measured",
        ]}
        label="What you'll find here"
        speed={40}
        separator="✦"
        className="border-b border-border py-4 font-display text-xl font-bold uppercase md:text-2xl"
      />

      {categoryTiles.length > 0 ? (
        <section aria-labelledby="home-categories" className="site-container py-16 md:py-20">
          <SectionHeading id="home-categories" eyebrow="Start here" title="Shop by category" />
          <CategoryTiles tiles={categoryTiles} />
        </section>
      ) : null}

      {newArrivals.length > 0 ? (
        <section aria-labelledby="home-new" className="site-container pb-16 md:pb-20">
          <SectionHeading
            id="home-new"
            eyebrow="Fresh off the rail"
            title="Just dropped"
            action={{ href: "/search?sort=newest", label: "View all" }}
          />
          <ProductRail label="Just dropped" autoplay>
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} sizes={RAIL_CARD_SIZES} />
            ))}
          </ProductRail>
        </section>
      ) : null}

      {drop ? (
        <div className="site-container pb-16 md:pb-20">
          <DropBanner drop={drop} />
        </div>
      ) : null}

      <section aria-labelledby="home-styles" className="site-container pb-16 md:pb-20">
        <SectionHeading id="home-styles" eyebrow="Find your thing" title="Shop by style" />
        <StyleTiles />
      </section>

      <section aria-labelledby="home-story" className="site-container pb-16 md:pb-20">
        <SectionHeading id="home-story" eyebrow="Why secondhand" title="Old clothes, new rules." />
        <StackCards cards={storyCards} />
      </section>

      {steals.length > 0 ? (
        <section aria-labelledby="home-steals" className="site-container pb-16 md:pb-20">
          <SectionHeading
            id="home-steals"
            eyebrow="Steals"
            title={`Under ${formatINR(stealsMaxPaise)}`}
            action={{ href: `/search?max=${stealsMaxPaise / 100}`, label: "See all steals" }}
          />
          <ProductRail label={`Under ${formatINR(stealsMaxPaise)}`}>
            {steals.map((product) => (
              <ProductCard key={product.id} product={product} sizes={RAIL_CARD_SIZES} />
            ))}
          </ProductRail>
        </section>
      ) : null}

      <section aria-labelledby="home-lookbook" className="site-container pb-16 md:pb-24">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold tracking-widest text-primary uppercase">
              The lookbook
            </p>
            <RevealText as="h2" id="home-lookbook" className="text-2xl font-bold md:text-4xl">
              Worn in, not worn out. See how we style this season&rsquo;s finds.
            </RevealText>
            <HoverMarquee href="/lookbook" label="See the lookbook" className="mt-8" />
          </div>
          <MaskedVideo
            mp4="/placeholders/loop.mp4"
            webm="/placeholders/loop.webm"
            poster="/placeholders/loop-poster.jpg"
          />
        </div>
      </section>

      {stats ? <ImpactStats stats={stats} /> : null}
      <TrustStrip />
    </>
  );
}
