import Image from "next/image";
import { HoverMarquee } from "@/components/motion/HoverMarquee";
import { Magnetic } from "@/components/motion/Magnetic";
import { Parallax } from "@/components/motion/Parallax";
import { RevealText } from "@/components/motion/RevealText";
import type { FeaturedDrop } from "@/lib/server/catalogue";
import { Countdown } from "./Countdown";

type Props = { drop: FeaturedDrop };

// Upcoming (or latest) drop: Parallax image behind an ink overlay, with a countdown before go-live
// (MOTION.md §6 step 3, CLAUDE.md §8).
export function DropBanner({ drop }: Props) {
  return (
    <section
      aria-labelledby="home-drop"
      className="surface-dark relative isolate flex min-h-[30rem] items-end overflow-hidden rounded-lg bg-bg text-fg"
    >
      {drop.bannerUrl ? (
        <Parallax amount={12} className="absolute inset-0 -z-10">
          <Image
            src={drop.bannerUrl}
            alt=""
            fill
            sizes="(min-width: 1440px) 1376px, 100vw"
            className="object-cover"
          />
        </Parallax>
      ) : null}
      {/* Keeps text readable whatever the banner image is. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-linear-to-t from-bg via-bg/75 to-bg/20"
      />

      <div className="flex w-full flex-col gap-6 p-6 md:p-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl">
          <p className="text-xs font-semibold tracking-widest text-accent uppercase">
            {drop.isLive ? "Live now" : "Upcoming drop"}
          </p>
          <RevealText as="h2" id="home-drop" className="mt-2 text-3xl font-bold md:text-4xl">
            {drop.name}
          </RevealText>
          <p className="mt-3 text-base text-fg/80">{drop.description}</p>
          {drop.isLive ? null : <Countdown target={drop.goLiveAt} className="mt-6" />}
        </div>
        <Magnetic className="self-start lg:self-end">
          <HoverMarquee
            href={`/drops/${drop.slug}`}
            label={drop.isLive ? "Shop the drop" : "Get notified"}
          />
        </Magnetic>
      </div>
    </section>
  );
}
