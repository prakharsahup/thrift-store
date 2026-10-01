"use client";

import { Children } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useMotionEnabled } from "@/components/motion/MotionProvider";
import { CarouselButton } from "@/components/ui/CarouselButton";
import { useCarouselAutoplay } from "@/hooks/useCarouselAutoplay";
import { useCarouselState } from "@/hooks/useCarouselState";

type Props = {
  /** Accessible name, e.g. "Just dropped". */
  label: string;
  autoplay?: boolean;
  /** Server-rendered cards (ProductCard), one per slide. */
  children: React.ReactNode;
};

// Horizontal product rail. Cards are rendered on the server and passed in as children; this only
// adds Embla scrolling, arrows and (optionally) autoplay with a pause button.
export function ProductRail({ label, autoplay = false, children }: Props) {
  const motionEnabled = useMotionEnabled();
  const slides = Children.toArray(children);
  const [viewportRef, api] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    slidesToScroll: "auto",
  });
  const { canScrollPrev, canScrollNext } = useCarouselState(api);
  const play = useCarouselAutoplay(api, { enabled: autoplay && motionEnabled, delayMs: 5000 });

  return (
    <div aria-roledescription="carousel" aria-label={label} {...play.interactionProps}>
      <div ref={viewportRef} className="overflow-hidden">
        <ul className="-ml-4 flex">
          {slides.map((slide, i) => (
            <li
              key={i}
              className="min-w-0 shrink-0 grow-0 basis-[46%] pl-4 sm:basis-1/3 lg:basis-1/4 xl:basis-1/5"
            >
              {slide}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        {autoplay && motionEnabled ? (
          <CarouselButton
            label={`Pause ${label}`}
            pressed={play.userPaused}
            onClick={play.togglePaused}
          >
            {play.userPaused ? <Play aria-hidden /> : <Pause aria-hidden />}
          </CarouselButton>
        ) : null}
        <CarouselButton
          label="Previous"
          disabled={!canScrollPrev}
          onClick={() => api?.scrollPrev()}
        >
          <ChevronLeft aria-hidden />
        </CarouselButton>
        <CarouselButton label="Next" disabled={!canScrollNext} onClick={() => api?.scrollNext()}>
          <ChevronRight aria-hidden />
        </CarouselButton>
      </div>
    </div>
  );
}
