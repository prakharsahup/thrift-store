"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { useMotionEnabled } from "./MotionProvider";
import { useMotionTokens } from "./MotionTokensProvider";

type Props = { children: React.ReactNode };

// Path of the last page that mounted a transition. The first mount (a full page load) is skipped:
// the server-rendered page is already on screen, and covering it would only add a flash.
let lastPathname: string | null = null;

// Enter-only transition for a template.tsx (MOTION.md §5.9): a primary-colour panel covers the
// page and wipes off upward, then the content fades in. Total time = dur.page (< 700ms), and the
// overlay never takes pointer events, so it can't block clicks.
export function PageTransition({ children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const enabled = useMotionEnabled();
  const { dur, ease } = useMotionTokens();
  // Decided once per mount. React StrictMode runs effects twice in development; the second run
  // must reach the same answer instead of seeing its own update to lastPathname.
  const isNavigation = useRef<boolean | null>(null);

  useGSAP(
    () => {
      if (isNavigation.current === null) {
        isNavigation.current = lastPathname !== null && lastPathname !== pathname;
        lastPathname = pathname;
      }
      if (!enabled || !isNavigation.current) return;

      gsap
        .timeline()
        .set("[data-transition-overlay]", { autoAlpha: 1, yPercent: 0 })
        .to("[data-transition-overlay]", { yPercent: -100, duration: dur.page, ease: ease.inOut })
        .from(
          "[data-transition-content]",
          { opacity: 0, duration: dur.page / 2, ease: ease.out },
          dur.page / 2,
        )
        .set("[data-transition-overlay]", { autoAlpha: 0 });
    },
    // Runs once per mount: template.tsx remounts on every navigation.
    { scope: ref },
  );

  return (
    <div ref={ref}>
      <div
        data-transition-overlay
        aria-hidden
        className="pointer-events-none invisible fixed inset-0 z-50 bg-primary"
      />
      <div data-transition-content>{children}</div>
    </div>
  );
}
