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

const IMAGE_SIZES = "(min-width: 1024px) 58vw, 100vw";

// Home hero: admin-managed banners in an Embla carousel (CLAUDE.md §8). The first slide is the page's
// h1 and gets the load reveals (MOTION.md §6). Autoplays every 6s with motion on; pauses on hover
// or focus, and has a visible pause button.
export function HeroCarousel({ banners }: Props) {
  const motionEnabled = useMotionEnabled();
  const [viewportRef, api] = useEmblaCarousel({ loop: banners.length > 1 });
  const { selectedIndex } = useCarouselState(api);
  const autoplay = useCarouselAutoplay(api, { enabled: motionEnabled && banners.length > 1 });

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      className="surface-dark bg-fg text-bg"
      {...autoplay.interactionProps}
    >
      <div ref={viewportRef} className="overflow-hidden">
        <div className="flex">
          {banners.map((banner, i) => (
            <div
              key={banner.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${banners.length}`}
              className="min-w-0 shrink-0 grow-0 basis-full"
            >
              <div className="grid lg:min-h-[34rem] lg:grid-cols-[5fr_7fr]">
                <div className="order-2 flex flex-col justify-center gap-5 px-4 py-10 lg:order-1 lg:px-12 lg:py-16">
                  {i === 0 ? (
                    <RevealText as="h1" trigger="load" className="text-3xl font-bold md:text-4xl">
                      {banner.title}
                    </RevealText>
                  ) : (
                    <h2 className="text-3xl font-bold md:text-4xl">{banner.title}</h2>
                  )}
                  {banner.subtitle ? (
                    <p className="max-w-md text-base text-bg/80 lg:text-lg">{banner.subtitle}</p>
                  ) : null}
                  <Magnetic className="self-start">
                    <HoverMarquee href={banner.linkUrl} label={banner.ctaLabel} />
                  </Magnetic>
                </div>
                <div className="relative order-1 aspect-[16/10] lg:order-2 lg:aspect-auto">
                  {i === 0 ? (
                    <RevealImage
                      src={banner.imageUrl}
                      alt={banner.imageAlt}
                      sizes={IMAGE_SIZES}
                      priority
                      trigger="load"
                      className="absolute inset-0"
                    />
                  ) : (
                    <Image
                      src={banner.imageUrl}
                      alt={banner.imageAlt}
                      fill
                      sizes={IMAGE_SIZES}
                      className="object-cover"
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {banners.length > 1 ? (
        <div className="site-container flex items-center justify-between gap-4 py-4">
          <div className="flex gap-2">
            {banners.map((banner, i) => (
              <button
                key={banner.id}
                type="button"
                aria-label={`Show slide ${i + 1}: ${banner.title}`}
                aria-current={i === selectedIndex ? "true" : undefined}
                onClick={() => api?.scrollTo(i)}
                className="flex h-10 items-center"
              >
                <span
                  className={cn(
                    "block h-1 rounded-full transition-all",
                    i === selectedIndex ? "w-8 bg-accent" : "w-4 bg-bg/40",
                  )}
                />
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {motionEnabled ? (
              <CarouselButton
                tone="dark"
                label="Pause slideshow"
                pressed={autoplay.userPaused}
                onClick={autoplay.togglePaused}
              >
                {autoplay.userPaused ? <Play aria-hidden /> : <Pause aria-hidden />}
              </CarouselButton>
            ) : null}
            <CarouselButton tone="dark" label="Previous slide" onClick={() => api?.scrollPrev()}>
              <ChevronLeft aria-hidden />
            </CarouselButton>
            <CarouselButton tone="dark" label="Next slide" onClick={() => api?.scrollNext()}>
              <ChevronRight aria-hidden />
            </CarouselButton>
          </div>
        </div>
      ) : null}
    </section>
  );
}
