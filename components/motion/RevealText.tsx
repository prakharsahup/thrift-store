"use client";

import { useRef } from "react";
import { SplitText } from "gsap/SplitText";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { useMotionEnabled } from "./MotionProvider";
import { useMotionTokens } from "./MotionTokensProvider";

// Registered here, not in lib/motion/gsap.ts, so only pages that reveal text ship SplitText.
if (typeof window !== "undefined") gsap.registerPlugin(SplitText);

type Props = {
  as?: "h1" | "h2" | "h3" | "p";
  /** Seconds before the reveal starts. */
  delay?: number;
  /** "load" for above-the-fold text, "scroll" to reveal when it enters the viewport. */
  trigger?: "load" | "scroll";
  id?: string;
  className?: string;
  children: React.ReactNode;
};

// Line-by-line masked reveal (MOTION.md §5.4). The server renders plain text; lines are split in
// the browser after fonts load (correct line breaks, no layout shift) and re-split on resize.
// SplitText keeps the original text available to screen readers.
export function RevealText({
  as: Tag = "p",
  delay = 0,
  trigger = "scroll",
  id,
  className,
  children,
}: Props) {
  const ref = useRef<HTMLHeadingElement>(null);
  const enabled = useMotionEnabled();
  const { dur, ease, stagger, reveal } = useMotionTokens();

  useGSAP(
    (_context, contextSafe) => {
      const el = ref.current;
      if (!el) return;
      if (!enabled || !contextSafe) {
        el.dataset.revealReady = "";
        return;
      }

      let cancelled = false;
      // contextSafe: the split and tween are created after an await, so they must be registered
      // with this component's GSAP context to be reverted on unmount.
      const run = contextSafe(() => {
        SplitText.create(el, {
          type: "lines",
          mask: "lines",
          // Masks get this class + "-mask"; globals.css gives them room for descenders.
          linesClass: "reveal-line",
          autoSplit: true,
          onSplit: (self) => {
            const tween = gsap.from(self.lines, {
              // 120, not 100: the mask extends 0.12em below each line (descenders), so lines start
              // a little lower to be fully hidden.
              yPercent: 120,
              duration: dur.slow,
              ease: ease.out,
              stagger: stagger.lines,
              delay,
              scrollTrigger:
                trigger === "scroll" ? { trigger: el, start: reveal.start, once: true } : undefined,
            });
            el.dataset.revealReady = "";
            // Returning the tween lets autoSplit carry its progress over when lines re-split.
            return tween;
          },
        });
      });

      void document.fonts.ready.then(() => {
        if (!cancelled) run();
      });
      return () => {
        cancelled = true;
      };
    },
    {
      scope: ref,
      dependencies: [enabled, delay, trigger, dur.slow, ease.out, stagger.lines, reveal.start],
      revertOnUpdate: true,
    },
  );

  return (
    <Tag ref={ref} id={id} data-reveal={trigger} className={className}>
      {children}
    </Tag>
  );
}
