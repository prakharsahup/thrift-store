import type { Metadata } from "next";
import Image from "next/image";
import { HoverMarquee } from "@/components/motion/HoverMarquee";
import { Parallax } from "@/components/motion/Parallax";
import { RevealImage } from "@/components/motion/RevealImage";
import { RevealText } from "@/components/motion/RevealText";
import { site } from "@/lib/config/site";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = {
  title: "Lookbook",
  description: `Styled one-of-one finds from ${site.name}: how we'd wear this season's pieces.`,
};

type Look = {
  image: string;
  alt: string;
  title: string;
  caption: string;
  href: string;
  /** full: edge-to-edge reveal. left/right: image on that side, with parallax. */
  layout: "full" | "left" | "right";
};

// Placeholder looks and captions — swap for real shoots.
const looks: Look[] = [
  {
    image: "/placeholders/banner.jpg",
    alt: "Placeholder for look one, a full-length outfit",
    title: "01 — Monsoon layers",
    caption: "A broken-in trucker over a heavyweight hoodie. Built for grey skies and long walks.",
    href: "/drops/monsoon-denim",
    layout: "full",
  },
  {
    image: "/placeholders/look-1.jpg",
    alt: "Placeholder for look two",
    title: "02 — Office, but make it vintage",
    caption:
      "Pleated wide-legs, a crisp oxford and the cardigan your grandfather would approve of.",
    href: "/c/women-trousers",
    layout: "left",
  },
  {
    image: "/placeholders/look-2.jpg",
    alt: "Placeholder for look three",
    title: "03 — Y2K, revisited",
    caption: "Baby tee, low-rise flares and a beaded bag. Exactly as loud as it should be.",
    href: "/search?style=y2k",
    layout: "right",
  },
  {
    image: "/placeholders/look-3.jpg",
    alt: "Placeholder for look four",
    title: "04 — Weekend sport",
    caption: "A colour-block windbreaker with track pants. Comfortable, a little bit 1998.",
    href: "/search?style=sporty",
    layout: "left",
  },
];

// Lookbook (MOTION.md §6): full-bleed RevealImages, alternating Parallax, a RevealText caption for
// each look.
export default function LookbookPage() {
  return (
    <>
      <header className="site-container py-16 md:py-24">
        <p className="text-xs font-semibold tracking-widest text-primary uppercase">
          Lookbook · this season
        </p>
        <RevealText
          as="h1"
          trigger="load"
          className="mt-3 max-w-4xl text-3xl font-bold md:text-4xl"
        >
          Worn in, not worn out.
        </RevealText>
        <RevealText
          trigger="load"
          delay={0.2}
          className="mt-6 max-w-prose text-base text-muted md:text-lg"
        >
          Four ways we&rsquo;d wear what&rsquo;s on the rails right now. Every piece is one of one,
          so if something catches your eye, don&rsquo;t wait.
        </RevealText>
      </header>

      <ol className="space-y-20 pb-24 md:space-y-32">
        {looks.map((look, i) =>
          look.layout === "full" ? (
            <li key={look.title}>
              <RevealImage
                src={look.image}
                alt={look.alt}
                sizes="100vw"
                priority={i === 0}
                trigger={i === 0 ? "load" : "scroll"}
                className="aspect-[4/5] w-full md:aspect-[2/1]"
              />
              <div className="site-container mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="max-w-xl">
                  <RevealText as="h2" className="text-xl font-bold md:text-2xl">
                    {look.title}
                  </RevealText>
                  <RevealText className="mt-2 text-base text-muted">{look.caption}</RevealText>
                </div>
                <HoverMarquee href={look.href} label="Shop the look" variant="outline" />
              </div>
            </li>
          ) : (
            <li
              key={look.title}
              className="site-container grid items-center gap-8 md:grid-cols-2 md:gap-16"
            >
              <Parallax
                amount={8}
                className={cn(
                  "aspect-[3/4] w-full rounded-lg",
                  look.layout === "right" && "md:order-2",
                )}
              >
                <Image
                  src={look.image}
                  alt={look.alt}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </Parallax>
              <div>
                <RevealText as="h2" className="text-xl font-bold md:text-3xl">
                  {look.title}
                </RevealText>
                <RevealText className="mt-4 max-w-prose text-base text-muted md:text-lg">
                  {look.caption}
                </RevealText>
                <HoverMarquee href={look.href} label="Shop the look" className="mt-8" />
              </div>
            </li>
          ),
        )}
      </ol>
    </>
  );
}
