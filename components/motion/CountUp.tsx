"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { useMotionEnabled } from "./MotionProvider";
import { useMotionTokens } from "./MotionTokensProvider";

type Props = {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
};

const numberFormat = new Intl.NumberFormat("en-IN");

// Counts up once when scrolled into view (MOTION.md §5.10). The server renders the final number,
// screen readers only ever get the final number, and the digits' width is reserved (no shift).
export function CountUp({ value, prefix = "", suffix = "", className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const enabled = useMotionEnabled();
  const { dur, ease, reveal } = useMotionTokens();
  const final = numberFormat.format(value);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !enabled) return;

      const counter = { n: 0 };
      el.textContent = numberFormat.format(0);
      gsap.to(counter, {
        n: value,
        duration: dur.slow,
        ease: ease.out,
        onUpdate: () => {
          el.textContent = numberFormat.format(Math.round(counter.n));
        },
        scrollTrigger: { trigger: el, start: reveal.start, once: true },
      });
      return () => {
        el.textContent = numberFormat.format(value);
      };
    },
    {
      scope: ref,
      dependencies: [enabled, value, dur.slow, ease.out, reveal.start],
      revertOnUpdate: true,
    },
  );

  return (
    <span className={className}>
      <span className="sr-only">
        {prefix}
        {final}
        {suffix}
      </span>
      <span aria-hidden>
        {prefix}
        <span
          ref={ref}
          className="inline-block text-right tabular-nums"
          style={{ minWidth: `${final.length}ch` }}
        >
          {final}
        </span>
        {suffix}
      </span>
    </span>
  );
}
