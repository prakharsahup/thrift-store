import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { BrandTiles } from "@/components/home/BrandTiles";
import { CategoryTiles } from "@/components/home/CategoryTiles";
import { DropBanner } from "@/components/home/DropBanner";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { ImpactStats } from "@/components/home/ImpactStats";
import { ProductRail } from "@/components/home/ProductRail";
import { SectionHeading } from "@/components/home/SectionHeading";
import { StyleIndex } from "@/components/home/StyleIndex";
import { TrustStrip } from "@/components/home/TrustStrip";
import { HoverMarquee } from "@/components/motion/HoverMarquee";
import { Marquee } from "@/components/motion/Marquee";
import { MaskedVideo } from "@/components/motion/MaskedVideo";
import { RevealText } from "@/components/motion/RevealText";
import { StackCards } from "@/components/motion/StackCards";
import { ProductCard } from "@/components/product/ProductCard";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { featuredCategorySlugs, storyCards } from "@/lib/config/home";
import { styleTags } from "@/lib/config/navigation";
import { site } from "@/lib/config/site";
import {
  getBanners,
  getBrandTiles,
  getCategoryTiles,
  getFeaturedDrop,
  getImpactStats,
  getNewArrivals,
} from "@/lib/server/catalogue";

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
  const [banners, categoryTiles, brandTiles, newArrivals, drop, stats] = await Promise.all([
    getBanners(),
    getCategoryTiles(featuredCategorySlugs),
    getBrandTiles(),
    getNewArrivals(12),
    getFeaturedDrop(),
    getImpactStats(),
  ]);

  return (
    <>
      {banners.length > 0 ? (
        <HeroCarousel banners={banners} />
      ) : (
        <section className="surface-dark bg-surface py-20 text-fg">
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

      {/* Each section has its own heading treatment: ruled, stickered, split, indexed, price tag. */}
      {categoryTiles.length > 0 ? (
        <section aria-labelledby="home-categories" className="site-container py-16 md:py-20">
          <SectionHeading id="home-categories" variant="ruled" title="Shop by category" />
          <CategoryTiles tiles={categoryTiles} />
        </section>
      ) : null}

      {brandTiles.length > 0 ? (
        <section aria-labelledby="home-brands" className="site-container pb-16 md:pb-20">
          <SectionHeading id="home-brands" variant="ruled" title="Shop by brand" />
          <BrandTiles tiles={brandTiles} />
        </section>
      ) : null}

      {newArrivals.length > 0 ? (
        <section aria-labelledby="home-new" className="site-container pb-16 md:pb-20">
          <SectionHeading
            id="home-new"
            variant="sticker"
            sticker="Fresh this week"
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

      {/* Split: a big statement that stays put on desktop while the story cards stack beside it. */}
      <section
        aria-labelledby="home-story"
        className="site-container grid gap-10 pb-16 md:pb-20 lg:grid-cols-[2fr_3fr] lg:gap-16"
      >
        <div className="lg:sticky lg:top-24 lg:self-start">
          <RevealText as="h2" id="home-story" className="text-3xl font-bold md:text-4xl">
            Old clothes, new rules.
          </RevealText>
          <p className="mt-4 max-w-sm text-base text-muted">
            Why we only sell secondhand, and how we make buying it feel like buying new.
          </p>
          <ButtonLink href="/about" variant="link" className="mt-6">
            How it works <ArrowRight aria-hidden />
          </ButtonLink>
        </div>
        <StackCards cards={storyCards} />
      </section>

      <StyleIndex />

      <section aria-labelledby="home-lookbook" className="site-container py-16 md:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <RevealText as="h2" id="home-lookbook" className="text-3xl font-bold md:text-4xl">
              Worn in, not worn out.
            </RevealText>
            <p className="mt-4 max-w-md text-base text-muted md:text-lg">
              The lookbook: how we&rsquo;d style this season&rsquo;s one-of-one finds, head to toe.
            </p>
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
