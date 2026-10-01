"use client";

import { useEffect, useState } from "react";
import type { UseEmblaCarouselType } from "embla-carousel-react";

type EmblaApi = UseEmblaCarouselType[1];

type Options = {
  /** Autoplay only when allowed (motion on, more than one slide). */
  enabled: boolean;
  delayMs?: number;
};

// Autoplay with the controls WCAG 2.2.2 needs: a visible pause button (userPaused), and an automatic
// pause while the pointer or keyboard focus is inside the carousel.
export function useCarouselAutoplay(api: EmblaApi, { enabled, delayMs = 6000 }: Options) {
  const [userPaused, setUserPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const running = enabled && !userPaused && !interacting && api !== undefined;

  useEffect(() => {
    if (!api || !running) return;
    const id = window.setInterval(() => {
      if (api.canScrollNext()) api.scrollNext();
      else api.scrollTo(0);
    }, delayMs);
    return () => window.clearInterval(id);
  }, [api, running, delayMs]);

  return {
    running,
    userPaused,
    togglePaused: () => setUserPaused((paused) => !paused),
    /** Spread onto the carousel's root element. */
    interactionProps: {
      onPointerEnter: () => setInteracting(true),
      onPointerLeave: () => setInteracting(false),
      onFocus: () => setInteracting(true),
      onBlur: (event: React.FocusEvent<HTMLElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false);
      },
    },
  };
}
