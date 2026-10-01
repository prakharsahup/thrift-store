"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils/cn";
import { useMotionEnabled } from "./MotionProvider";
import { useMotionTokens } from "./MotionTokensProvider";

type Props = {
  /** Furthest the element moves toward the cursor, in px. */
  max?: number;
  className?: string;
  children: React.ReactNode;
};

// Magnetic CTA (MOTION.md §5.10): wrap a button or link and it leans up to `max`px toward the
// cursor. Desktop (fine pointer + hover) only.
export function Magnetic({ max = 6, className, children }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const enabled = useMotionEnabled();
  const { dur, ease } = useMotionTokens();

  useGSAP(
    (_context, contextSafe) => {
      const el = ref.current;
      if (!el || !enabled || !contextSafe) return;
      if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

      const xTo = gsap.quickTo(el, "x", { duration: dur.fast, ease: ease.out });
      const yTo = gsap.quickTo(el, "y", { duration: dur.fast, ease: ease.out });
      const clamp = gsap.utils.clamp(-1, 1);

      const onMove = contextSafe((event: PointerEvent) => {
        const box = el.getBoundingClientRect();
        // -1…1 from the centre of the element to its edges.
        xTo(clamp((event.clientX - box.left - box.width / 2) / (box.width / 2)) * max);
        yTo(clamp((event.clientY - box.top - box.height / 2) / (box.height / 2)) * max);
      });
      const onLeave = contextSafe(() => {
        xTo(0);
        yTo(0);
      });

      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
      return () => {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope: ref, dependencies: [enabled, max, dur.fast, ease.out], revertOnUpdate: true },
  );

  return (
    <span ref={ref} className={cn("inline-block", className)}>
      {children}
    </span>
  );
}
