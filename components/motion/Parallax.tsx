"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils/cn";
import { useMotionEnabled } from "./MotionProvider";
import { useMotionTokens } from "./MotionTokensProvider";

type Props = {
  /** How far the content drifts, as a % of the frame's height in each direction. */
  amount?: number;
  /** Sizes the frame, e.g. "aspect-[2/1] w-full". */
  className?: string;
  /** Usually a next/image with `fill`. */
  children: React.ReactNode;
};

// Scroll-scrubbed drift (MOTION.md §5.6). The inner layer overhangs the frame by `amount`% at the
// top and bottom, and travels exactly that far, so its edges never show.
export function Parallax({ amount = 10, className, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const enabled = useMotionEnabled();
  const { ease } = useMotionTokens();

  useGSAP(
    () => {
      const frame = ref.current;
      if (!enabled || !frame) return;
      const shift = () => (frame.offsetHeight * amount) / 100;

      gsap.fromTo(
        "[data-parallax-layer]",
        { y: () => -shift() },
        {
          y: () => shift(),
          ease: ease.scrub,
          scrollTrigger: {
            trigger: frame,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      );
    },
    { scope: ref, dependencies: [enabled, amount, ease.scrub], revertOnUpdate: true },
  );

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      <div
        data-parallax-layer
        className="absolute inset-x-0"
        style={{ top: `-${amount}%`, bottom: `-${amount}%` }}
      >
        {children}
      </div>
    </div>
  );
}
