"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Maximize2, X } from "lucide-react";
import { useCarouselState } from "@/hooks/useCarouselState";
import { cn } from "@/lib/utils/cn";

type Props = {
  images: { url: string; alt: string }[];
  title: string;
};

const MAIN_SIZES = "(min-width: 1024px) 50vw, 100vw";

// PDP gallery (CLAUDE.md §8): swipe on phones, thumbnails on desktop, and a full-screen zoom view.
export function Gallery({ images, title }: Props) {
  const [viewportRef, api] = useEmblaCarousel();
  const { selectedIndex } = useCarouselState(api);
  const [zoomed, setZoomed] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (zoomed && !dialog.open) dialog.showModal();
    if (!zoomed && dialog.open) dialog.close();
  }, [zoomed]);

  if (images.length === 0) {
    return <div className="aspect-[3/4] rounded-md bg-surface" aria-label="No photo yet" />;
  }

  const current = images[selectedIndex] ?? images[0];

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
                "relative block aspect-[3/4] w-full overflow-hidden rounded-sm border-2",
                i === selectedIndex ? "border-fg" : "border-transparent hover:border-border",
              )}
            >
              <Image src={image.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          </li>
        ))}
      </ul>

      {/* Main carousel */}
      <div className="relative">
        <div
          ref={viewportRef}
          className="overflow-hidden rounded-md bg-surface"
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
                <Image
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

        <button
          type="button"
          onClick={() => setZoomed(true)}
          className="absolute top-3 right-3 inline-flex size-10 items-center justify-center rounded-full bg-bg/90 text-fg hover:bg-bg"
        >
          <Maximize2 aria-hidden className="size-4" />
          <span className="sr-only">Zoom photo</span>
        </button>

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

      {/* Zoom: the current photo at full resolution, scrollable. Native dialog = focus trap + Esc. */}
      <dialog
        ref={dialogRef}
        aria-label={`Zoomed photo of ${title}`}
        onClose={() => setZoomed(false)}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-fg p-0 backdrop:bg-overlay"
      >
        <button
          type="button"
          onClick={() => setZoomed(false)}
          autoFocus
          className="surface-dark fixed top-4 right-4 z-10 inline-flex size-11 items-center justify-center rounded-full bg-bg text-fg"
        >
          <X aria-hidden className="size-5" />
          <span className="sr-only">Close zoom</span>
        </button>
        {zoomed ? (
          <div className="relative mx-auto h-[200dvh] max-w-5xl">
            <Image
              src={current.url}
              alt={current.alt || title}
              fill
              sizes="(min-width: 1024px) 64rem, 200vw"
              className="object-contain"
            />
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
