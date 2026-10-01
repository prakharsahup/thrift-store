"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { useMotionEnabled } from "./MotionProvider";
import { useMotionTokens } from "./MotionTokensProvider";

type Props = { children: React.ReactNode };

// Resolves when the eager images on the page have loaded (or after a timeout), so ScrollTrigger
// measures the final layout. Lazy images below the fold are ignored — they reserve their space.
function whenImagesLoaded(timeoutMs = 3000): Promise<void> {
  const pending = Array.from(document.images).filter(
    (img) => !img.complete && img.loading !== "lazy",
  );
  const loads = pending.map(
    (img) =>
      new Promise<void>((resolve) => {
        img.addEventListener("load", () => resolve(), { once: true });
        img.addEventListener("error", () => resolve(), { once: true });
      }),
  );
  const timeout = new Promise<void>((resolve) => window.setTimeout(resolve, timeoutMs));
  return Promise.race([Promise.all(loads).then(() => undefined), timeout]);
}

// Lenis inertia scroll driven by GSAP's ticker (MOTION.md §5.1). Brand pages only — never on
// shopping pages. Touch scrolling stays native (Lenis' default), which is already smooth.
export function SmoothScroll({ children }: Props) {
  const enabled = useMotionEnabled();
  const { lenis: config } = useMotionTokens();
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (!enabled) return;

    const lenis = new Lenis({
      lerp: config.lerp,
      wheelMultiplier: config.wheelMultiplier,
      // Inside an open drawer/modal, scroll natively (the page behind is locked).
      prevent: (node) => node.closest("dialog, [data-lenis-prevent]") !== null,
    });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33); // GSAP's default
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [enabled, config.lerp, config.wheelMultiplier]);

  // On a route change: jump to the top, then re-measure ScrollTriggers once images have loaded.
  // The first render is skipped so reloads and #anchor links keep their scroll position.
  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;

    lenisRef.current?.scrollTo(0, { immediate: true, force: true });
    let cancelled = false;
    void whenImagesLoaded().then(() => {
      if (!cancelled) ScrollTrigger.refresh();
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return <>{children}</>;
}
