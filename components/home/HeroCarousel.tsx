"use client";

import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { DropCountdown } from "@/components/drops/DropCountdown";
import { useMotionEnabled } from "@/components/motion/MotionProvider";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { CarouselButton } from "@/components/ui/CarouselButton";
import { useCarouselAutoplay } from "@/hooks/useCarouselAutoplay";
import { useCarouselState } from "@/hooks/useCarouselState";
import { cn } from "@/lib/utils/cn";

export type HeroSlide = {
  id: string;
  eyebrow: string;
  title: string;
  body?: string | null;
  /** Skewed bone label under the title, e.g. "Mon · 11:19 am · 3 pieces". */
  sticker?: string;
  /** Go-live time: shows the countdown boxes. */
  countdownTo?: string;
  cta: { href: string; label: string };
  /** One wide image (a banner or drop image)… */
  image?: { url: string; alt: string } | null;
  /** …or up to three piece photos side by side. */
  pieces?: { href: string; title: string; imageUrl: string | null; alt: string }[];
};

type Props = { slides: HeroSlide[] };

const IMAGE_SIZES = "(min-width: 1440px) 820px, (min-width: 1024px) 58vw, 100vw";

// Home hero (Drop Night design): a swipeable carousel of the current drop, the owner's banners and
// the newest pieces. Text sits on ink at the left, artwork at the right; square corners, purple
// only on the button. Autoplays every 6 s with motion on; pauses on hover/focus and has a visible
// pause button. The first slide's title is the page's h1.
export function HeroCarousel({ slides }: Props) {
  const motionEnabled = useMotionEnabled();
  const many = slides.length > 1;
  const [viewportRef, api] = useEmblaCarousel({ loop: many });
  const { selectedIndex } = useCarouselState(api);
  const autoplay = useCarouselAutoplay(api, { enabled: motionEnabled && many });

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      className="site-container pt-4 md:pt-6"
      {...autoplay.interactionProps}
    >
      <div ref={viewportRef} className="overflow-hidden border border-border">
        <div className="flex">
          {slides.map((slide, i) => {
            const Heading = i === 0 ? "h1" : "h2";
            return (
              <div
                key={slide.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${slides.length}`}
                className="min-w-0 shrink-0 grow-0 basis-full"
              >
                <div className="grid h-full lg:min-h-[30rem] lg:grid-cols-[5fr_7fr]">
                  <div className="order-2 flex flex-col justify-end gap-4 p-6 md:p-10 lg:order-1">
                    <p className="text-xs font-bold tracking-widest text-accent uppercase">
                      {slide.eyebrow}
                    </p>
                    <Heading className="text-3xl text-accent md:text-4xl">{slide.title}</Heading>
                    {slide.sticker ? (
                      <p className="w-fit -rotate-2 bg-fg px-3 py-1 font-display text-sm text-bg md:text-base">
                        {slide.sticker}
                      </p>
                    ) : null}
                    {slide.body ? (
                      <p className="max-w-md text-base text-muted">{slide.body}</p>
                    ) : null}
                    {slide.countdownTo ? <DropCountdown target={slide.countdownTo} /> : null}
                    <ButtonLink href={slide.cta.href} size="lg" className="mt-2 self-start">
                      {slide.cta.label}
                    </ButtonLink>
                  </div>

                  <div className="relative order-1 aspect-[4/3] bg-surface lg:order-2 lg:aspect-auto">
                    {slide.pieces && slide.pieces.length > 0 ? (
                      <div className="absolute inset-0 grid grid-cols-3 gap-px bg-border">
                        {slide.pieces.slice(0, 3).map((piece, p) => (
                          <Link
                            key={piece.href}
                            href={piece.href}
                            tabIndex={-1}
                            className="group relative block overflow-hidden bg-surface"
                          >
                            {piece.imageUrl ? (
                              <Image
                                src={piece.imageUrl}
                                alt={piece.alt}
                                fill
                                priority={i === 0 && p === 0}
                                sizes="(min-width: 1024px) 20vw, 33vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <span className="halftone absolute inset-0" />
                            )}
                          </Link>
                        ))}
                      </div>
                    ) : slide.image ? (
                      <Image
                        src={slide.image.url}
                        alt={slide.image.alt}
                        fill
                        priority={i === 0}
                        sizes={IMAGE_SIZES}
                        className="object-cover"
                      />
                    ) : (
                      <span className="halftone absolute inset-0" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {many ? (
        <div className="flex items-center justify-between gap-4 pt-3">
          <div className="flex gap-1">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Show slide ${i + 1}: ${slide.title}`}
                aria-current={i === selectedIndex ? "true" : undefined}
                onClick={() => api?.scrollTo(i)}
                className="flex h-10 cursor-pointer items-center px-1"
              >
                <span
                  className={cn(
                    "block h-1 transition-all",
                    i === selectedIndex ? "w-8 bg-accent" : "w-4 bg-input",
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
