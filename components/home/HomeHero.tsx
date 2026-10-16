import Image from "next/image";
import Link from "next/link";
import { DropCountdown } from "@/components/drops/DropCountdown";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { cn } from "@/lib/utils/cn";

export type HeroTile = { href: string; title: string; imageUrl: string | null; alt: string };

type Props = {
  eyebrow: string;
  title: string;
  /** Long titles ("Pehle aao, pehle pao.") step down from the poster size. */
  titleSize?: "poster" | "headline";
  sticker: string;
  /** Go-live time: shows the countdown boxes. */
  countdownTo?: string;
  primary: { href: string; label: string };
  tiles: HeroTile[];
  caption: string;
};

// Three tiles of deliberately different sizes, bottom-aligned like a rack (Drop Night design).
const tileShapes = ["aspect-square", "aspect-[11/12]", "aspect-[16/15]"] as const;

// Home hero (Drop Night design): eyebrow, poster title with a skewed date sticker, countdown and
// the call to action, then an uneven row of piece photos. Static, no sliding. The same layout
// serves an upcoming drop, a live drop and the no-drop case.
export function HomeHero({
  eyebrow,
  title,
  titleSize = "poster",
  sticker,
  countdownTo,
  primary,
  tiles,
  caption,
}: Props) {
  const poster = titleSize === "poster";
  return (
    <section aria-labelledby="home-hero" className="site-container pt-8 pb-16 md:pt-12 md:pb-24">
      <p className="text-xs font-bold tracking-widest text-accent uppercase">{eyebrow}</p>
      <h1
        id="home-hero"
        className={cn("mt-2 text-accent", poster ? "text-hero" : "max-w-5xl text-3xl md:text-4xl")}
      >
        {title}
      </h1>
      <p
        className={cn(
          "relative z-10 ml-2 inline-block -rotate-2 bg-fg px-4 py-2 font-display text-base text-bg sm:ml-[12%] md:text-xl",
          poster ? "-mt-2 md:-mt-4" : "mt-4",
        )}
      >
        {sticker}
      </p>

      <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        {countdownTo ? <DropCountdown target={countdownTo} /> : <span />}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <ButtonLink href={primary.href} size="lg">
            {primary.label}
          </ButtonLink>
          <Link
            href="#how-claiming-works"
            className="text-sm font-semibold text-accent underline underline-offset-4 hover:text-fg"
          >
            How claiming works
          </Link>
        </div>
      </div>

      {tiles.length > 0 ? (
        <div className="mt-12 grid grid-cols-3 items-end gap-2 sm:gap-3 md:mt-16 md:grid-cols-[1fr_1.2fr_0.95fr_0.8fr]">
          {tiles.slice(0, 3).map((tile, i) => (
            <Link
              key={tile.href}
              href={tile.href}
              className={cn("group relative block overflow-hidden bg-surface", tileShapes[i])}
            >
              {tile.imageUrl ? (
                <Image
                  src={tile.imageUrl}
                  alt={tile.alt}
                  fill
                  priority={i === 0}
                  sizes="(min-width: 768px) 28vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <span className="halftone absolute inset-0" />
              )}
              <span className="sr-only">{tile.title}</span>
            </Link>
          ))}
          <p className="col-span-3 text-sm text-muted md:col-span-1 md:pb-1">{caption}</p>
        </div>
      ) : null}
    </section>
  );
}
