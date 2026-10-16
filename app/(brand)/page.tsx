import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CategoryTiles } from "@/components/home/CategoryTiles";
import { ClaimedGrid } from "@/components/home/ClaimedGrid";
import { ClaimExplainer } from "@/components/home/ClaimExplainer";
import { HomeHero, type HeroTile } from "@/components/home/HomeHero";
import { ProductRail } from "@/components/home/ProductRail";
import { Marquee } from "@/components/motion/Marquee";
import { ProductCard } from "@/components/product/ProductCard";
import { featuredCategorySlugs, marqueeItems } from "@/lib/config/home";
import { site } from "@/lib/config/site";
import { dropPhase, dropTimeLabel, piecesLabel } from "@/lib/drops/phase";
import {
  getCategoryTiles,
  getDropPieces,
  getFeaturedDrop,
  getImpactStats,
  getLastDrop,
  getNewArrivals,
  getRecentlyClaimed,
  type ProductCardData,
} from "@/lib/server/catalogue";

export const metadata: Metadata = {
  title: { absolute: `${site.name} — pre-loved fashion, one of one` },
  description: site.tagline,
};

// Cached and refreshed at most once a minute: new listings, claims and a drop going live show up
// quickly without hitting the database on every visit.
export const revalidate = 60;

const RAIL_CARD_SIZES =
  "(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 46vw";

const photos = (pieces: ProductCardData[]): HeroTile[] =>
  pieces.slice(0, 3).map((p) => ({
    href: `/p/${p.slug}`,
    title: p.title,
    imageUrl: p.images[0]?.url ?? null,
    alt: p.images[0]?.alt || p.title,
  }));

// Home (Drop Night design, hybrid). A static hero (the current drop when there is one, otherwise
// the newest pieces), the scrolling strip, the categories in the owner's order, the last drop (or
// recent claims), what's just in, and how claiming works.
export default async function HomePage() {
  const [featured, categoryTiles, newArrivals, stats] = await Promise.all([
    getFeaturedDrop(),
    getCategoryTiles(featuredCategorySlugs),
    getNewArrivals(15),
    getImpactStats(),
  ]);
  const hero = dropPhase(featured);
  const liveId = hero.phase === "live" ? hero.drop.id : null;
  const [livePieces, lastDrop, recentlyClaimed] = await Promise.all([
    liveId ? getDropPieces(liveId, 3) : Promise.resolve([]),
    getLastDrop(liveId),
    getRecentlyClaimed(8),
  ]);

  const heroPieces = hero.phase === "live" ? livePieces : newArrivals;
  const railPieces = newArrivals.slice(3, 15);

  return (
    <>
      {hero.phase === "upcoming" ? (
        <HomeHero
          eyebrow="Next drop"
          title={hero.drop.name}
          sticker={`${dropTimeLabel(hero.drop.goLiveAt)} · ${piecesLabel(hero.drop.pieceCount)}`}
          countdownTo={hero.drop.goLiveAt}
          primary={{ href: "#drop-alert", label: "Get the drop alert" }}
          tiles={photos(heroPieces)}
          caption="On the rack now, while you wait for the drop."
        />
      ) : hero.phase === "live" ? (
        <HomeHero
          eyebrow="Live now"
          title={hero.drop.name}
          sticker={`${piecesLabel(hero.drop.pieceCount)} · live now`}
          primary={{ href: `/drops/${hero.drop.slug}`, label: "Shop the drop" }}
          tiles={photos(heroPieces)}
          caption="One of each. When it's claimed, it's gone."
        />
      ) : (
        <HomeHero
          eyebrow="New on the rack"
          title="Pehle aao, pehle pao."
          titleSize="headline"
          sticker={stats ? `${piecesLabel(stats.listed)} live now` : "One of each. No restocks."}
          primary={{ href: "/search?sort=newest", label: "Shop new in" }}
          tiles={photos(heroPieces)}
          caption="Fresh this week. Graded, measured, flaws listed."
        />
      )}

      <Marquee
        items={marqueeItems}
        label="What you'll find here"
        speed={40}
        separator="✦"
        className="border-y border-border py-4 font-display text-xl text-accent uppercase md:text-2xl"
      />

      {categoryTiles.length > 0 ? (
        <section aria-labelledby="home-categories" className="site-container py-16 md:py-24">
          <h2 id="home-categories" className="mb-8 text-2xl md:text-3xl">
            Shop by category
          </h2>
          <CategoryTiles tiles={categoryTiles} />
        </section>
      ) : null}

      {lastDrop ? (
        <ClaimedGrid
          id="home-last-drop"
          title={`Last drop — ${lastDrop.name}`}
          pieces={lastDrop.pieces}
        />
      ) : recentlyClaimed.length > 0 ? (
        <ClaimedGrid id="home-claimed" title="Recently claimed" pieces={recentlyClaimed} />
      ) : null}

      {railPieces.length > 0 ? (
        <section aria-labelledby="home-new" className="site-container py-16 md:py-24">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 id="home-new" className="text-2xl md:text-3xl">
              Just in
            </h2>
            <Link
              href="/search?sort=newest"
              className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-accent uppercase hover:text-fg"
            >
              View all <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
          <ProductRail label="Just in">
            {railPieces.map((product) => (
              <ProductCard key={product.id} product={product} sizes={RAIL_CARD_SIZES} />
            ))}
          </ProductRail>
        </section>
      ) : null}

      <ClaimExplainer />
    </>
  );
}
