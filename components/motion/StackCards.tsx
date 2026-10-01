"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils/cn";
import { useMotionEnabled } from "./MotionProvider";
import { useMotionTokens } from "./MotionTokensProvider";

type Card = { eyebrow?: string; title: string; body: string };

type Props = {
  /** Up to 4 cards (MOTION.md §5.8); extras are ignored. */
  cards: readonly Card[];
  className?: string;
};

const MAX_CARDS = 4;

// Card colours cycle through the brand tokens.
const tones = [
  "bg-primary text-primary-fg",
  "bg-accent text-accent-fg",
  "surface-dark bg-fg text-bg",
  "bg-surface text-fg",
] as const;

// From md: cards are position: sticky with growing top offsets, and each one shrinks to 0.94 and
// dims as the next card slides over it (scrubbed). Below md: a plain list that fades in.
export function StackCards({ cards, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const enabled = useMotionEnabled();
  const { dur, ease, reveal } = useMotionTokens();
  const shown = cards.slice(0, MAX_CARDS);

  useGSAP(
    () => {
      if (!enabled) return;
      const items = gsap.utils.toArray<HTMLElement>("[data-stack-card]");
      // Non-sticky markers sit where each card starts in the flow. Sticky elements report their
      // stuck position, so triggers are measured from these instead.
      const markers = gsap.utils.toArray<HTMLElement>("[data-stack-marker]");
      const mm = gsap.matchMedia();

      mm.add("(min-width: 768px)", () => {
        items.forEach((card, i) => {
          const nextMarker = markers[i + 1];
          const nextCard = items[i + 1];
          if (!nextMarker || !nextCard) return;
          gsap.to(card, {
            scale: 0.94,
            opacity: 0.6,
            ease: ease.scrub,
            scrollTrigger: {
              trigger: nextMarker,
              start: "top bottom",
              // Finished when the next card reaches its own sticky offset.
              end: () => `top ${parseFloat(getComputedStyle(nextCard).top)}px`,
              scrub: true,
              invalidateOnRefresh: true,
            },
          });
        });
      });

      mm.add("(max-width: 767px)", () => {
        items.forEach((card) => {
          gsap.from(card, {
            opacity: 0,
            y: 24,
            duration: dur.base,
            ease: ease.out,
            scrollTrigger: { trigger: card, start: reveal.start, once: true },
          });
        });
      });
    },
    {
      scope: ref,
      dependencies: [enabled, shown.length, dur.base, ease.out, ease.scrub, reveal.start],
      revertOnUpdate: true,
    },
  );

  return (
    <div ref={ref} role="list" className={cn("flex flex-col gap-6 md:block md:pb-24", className)}>
      {shown.map((card, i) => (
        <div key={card.title} className="contents">
          <div data-stack-marker aria-hidden className="hidden h-0 md:block" />
          <article
            role="listitem"
            data-stack-card
            style={{ "--i": i } as React.CSSProperties}
            className={cn(
              "origin-top rounded-lg p-6 md:sticky md:top-[calc(5rem+var(--i)*1.5rem)] md:min-h-96 md:p-12",
              // Scroll distance between cards; the last one needs none.
              i < shown.length - 1 && "md:mb-[30vh]",
              tones[i % tones.length],
            )}
          >
            <p className="font-display text-sm font-bold opacity-80">
              {String(i + 1).padStart(2, "0")}
              {card.eyebrow ? ` · ${card.eyebrow}` : null}
            </p>
            <h3 className="mt-6 text-xl font-bold md:mt-16 md:text-3xl">{card.title}</h3>
            <p className="mt-4 max-w-prose text-base md:text-lg">{card.body}</p>
          </article>
        </div>
      ))}
    </div>
  );
}
