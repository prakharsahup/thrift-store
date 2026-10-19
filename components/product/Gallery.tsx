"use client";

import { useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { useCarouselState } from "@/hooks/useCarouselState";
import { cn } from "@/lib/utils/cn";
import { ZoomViewer } from "./ZoomViewer";

type Props = {
  images: { url: string; alt: string }[];
  title: string;
};

const MAIN_SIZES = "(min-width: 1024px) 50vw, 100vw";

// PDP gallery (CLAUDE.md §8): swipe on phones, thumbnails on desktop, and a full-screen zoom view
// (ZoomViewer) opened by tapping the photo or the zoom button.
export function Gallery({ images, title }: Props) {
  const [viewportRef, api] = useEmblaCarousel();
  const { selectedIndex } = useCarouselState(api);
  const [zoomed, setZoomed] = useState(false);

  if (images.length === 0) {
    return <div className="aspect-[3/4] rounded-md bg-surface" aria-label="No photo yet" />;
  }

  return (
    <div className="lg:grid lg:grid-cols-[5rem_1fr] lg:gap-4">
      {/* Thumbnails (desktop) */}
      <ul className="hidden flex-col gap-3 lg:flex" aria-label="Photos">
        {images.map((image, i) => (
          <li key={image.url}>
            <button
              type="button"
              onClick={() => api?.scrollTo(i)}
              aria-label={`Show photo ${i + 1} of ${images.length}`}
              aria-current={i === selectedIndex ? "true" : undefined}
              className={cn(
                "relative block aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-sm border-2",
                i === selectedIndex ? "border-fg" : "border-transparent hover:border-input",
              )}
            >
              <ImageWithFallback
                src={image.url}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      {/* Main carousel. Tapping a photo opens the zoom view (keyboard users have the button). */}
      <div className="relative">
        <div
          ref={viewportRef}
          // Embla swallows the click that ends a swipe, so dragging never opens the zoom.
          onClick={() => setZoomed(true)}
          className="cursor-zoom-in overflow-hidden rounded-md bg-surface"
          aria-roledescription="carousel"
          aria-label={`Photos of ${title}`}
        >
          <div className="flex">
            {images.map((image, i) => (
              <div
                key={image.url}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${images.length}`}
                className="relative aspect-[3/4] min-w-0 shrink-0 grow-0 basis-full"
              >
                <ImageWithFallback
                  src={image.url}
                  alt={image.alt || title}
                  fill
                  sizes={MAIN_SIZES}
                  priority={i === 0}
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        <Button
          variant="overlay"
          size="icon"
          shape="round"
          aria-haspopup="dialog"
          onClick={() => setZoomed(true)}
          className="absolute top-3 right-3"
        >
          <Maximize2 aria-hidden className="size-4" />
          <span className="sr-only">Zoom photo</span>
        </Button>

        {images.length > 1 ? (
          <div className="mt-3 flex justify-center gap-2 lg:hidden" aria-hidden>
            {images.map((image, i) => (
              <span
                key={image.url}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === selectedIndex ? "w-6 bg-fg" : "w-1.5 bg-border",
                )}
              />
            ))}
          </div>
        ) : null}
      </div>

      <ZoomViewer
        images={images}
        title={title}
        index={selectedIndex}
        onIndexChange={(i) => api?.scrollTo(i, true)}
        open={zoomed}
        onClose={() => setZoomed(false)}
      />
    </div>
  );
}
