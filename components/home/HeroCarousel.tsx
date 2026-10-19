"use client";

import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { HoverMarquee } from "@/components/motion/HoverMarquee";
import { Magnetic } from "@/components/motion/Magnetic";
import { useMotionEnabled } from "@/components/motion/MotionProvider";
import { RevealImage } from "@/components/motion/RevealImage";
import { RevealText } from "@/components/motion/RevealText";
import { CarouselButton } from "@/components/ui/CarouselButton";
import { useCarouselAutoplay } from "@/hooks/useCarouselAutoplay";
import { useCarouselState } from "@/hooks/useCarouselState";
import type { Banner } from "@/lib/server/catalogue";
import { cn } from "@/lib/utils/cn";

type Props = { banners: Banner[] };

// Banner artwork is 16:7 (1600×700, see supabase/seed.sql); the frame uses the same ratio, so
// object-cover never crops it. On desktop the image takes 7/12 of the container.
const IMAGE_SIZES = "(min-width: 1440px) 800px, (min-width: 1280px) 56vw, 100vw";

// Home hero: admin-managed banners in an Embla carousel (CLAUDE.md §8), inside the page container
// so its edges line up with every section below. The first slide is the page's h1 and gets the
// load reveals (MOTION.md §6). Autoplays every 6s with motion on; pauses on hover or focus, and
// has a visible pause button.
export function HeroCarousel({ banners }: Props) {
  const motionEnabled = useMotionEnabled();
  const [viewportRef, api] = useEmblaCarousel({ loop: banners.length > 1 });
  const { selectedIndex } = useCarouselState(api);
  const autoplay = useCarouselAutoplay(api, { enabled: motionEnabled && banners.length > 1 });

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      className="site-container pt-4 md:pt-6"
      {...autoplay.interactionProps}
    >
      <div ref={viewportRef} className="surface-dark overflow-hidden rounded-lg bg-surface text-fg">
        <div className="flex">
          {banners.map((banner, i) => (
            <div
              key={banner.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${banners.length}`}
              className="min-w-0 shrink-0 grow-0 basis-full"
            >
              <div className="grid h-full xl:grid-cols-[5fr_7fr] xl:items-center">
                <div className="order-2 flex flex-col gap-4 p-5 sm:p-8 xl:order-1 xl:gap-5 xl:p-10">
                  {i === 0 ? (
                    <RevealText as="h1" trigger="load" className="text-2xl font-bold md:text-3xl">
                      {banner.title}
                    </RevealText>
                  ) : (
                    <h2 className="text-2xl font-bold md:text-3xl">{banner.title}</h2>
                  )}
                  {banner.subtitle ? (
                    <p className="max-w-md text-base text-fg/80">{banner.subtitle}</p>
                  ) : null}
                  <Magnetic className="self-start">
                    <HoverMarquee href={banner.linkUrl} label={banner.ctaLabel} />
                  </Magnetic>
                </div>
                {i === 0 ? (
                  <RevealImage
                    src={banner.imageUrl}
                    alt={banner.imageAlt}
                    sizes={IMAGE_SIZES}
                    priority
                    trigger="load"
                    className="order-1 aspect-[16/7] w-full xl:order-2"
                  />
                ) : (
                  <div className="relative order-1 aspect-[16/7] w-full xl:order-2">
                    <Image
                      src={banner.imageUrl}
                      alt={banner.imageAlt}
                      fill
                      sizes={IMAGE_SIZES}
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {banners.length > 1 ? (
        <div className="flex items-center justify-between gap-4 pt-3">
          <div className="flex gap-1">
            {banners.map((banner, i) => (
              <button
                key={banner.id}
                type="button"
                aria-label={`Show slide ${i + 1}: ${banner.title}`}
                aria-current={i === selectedIndex ? "true" : undefined}
                onClick={() => api?.scrollTo(i)}
                className="flex h-10 cursor-pointer items-center px-1"
              >
                <span
                  className={cn(
                    "block h-1 rounded-full transition-all",
                    i === selectedIndex ? "w-8 bg-primary" : "w-4 bg-input",
                  )}
                />
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {motionEnabled ? (
              <CarouselButton
                label="Pause slideshow"
                pressed={autoplay.userPaused}
                onClick={autoplay.togglePaused}
              >
                {autoplay.userPaused ? <Play aria-hidden /> : <Pause aria-hidden />}
              </CarouselButton>
            ) : null}
            <CarouselButton label="Previous slide" onClick={() => api?.scrollPrev()}>
              <ChevronLeft aria-hidden />
            </CarouselButton>
            <CarouselButton label="Next slide" onClick={() => api?.scrollNext()}>
              <ChevronRight aria-hidden />
            </CarouselButton>
          </div>
        </div>
      ) : null}
    </section>
  );
}
