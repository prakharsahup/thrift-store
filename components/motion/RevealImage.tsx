"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils/cn";
import { useMotionEnabled } from "./MotionProvider";
import { useMotionTokens } from "./MotionTokensProvider";

type Props = {
  src: string;
  alt: string;
  sizes: string;
  /** Only for the first hero image on a page. */
  priority?: boolean;
  trigger?: "load" | "scroll";
  /** Sizes the frame, e.g. "aspect-[3/4] w-full" — the image fills it. */
  className?: string;
  imageClassName?: string;
};

// Clip reveal + settle (MOTION.md §5.5): the frame wipes open upward while the image eases from
// 1.15× to 1×. Animates clip-path and transform only.
export function RevealImage({
  src,
  alt,
  sizes,
  priority = false,
  trigger = "scroll",
  className,
  imageClassName,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const enabled = useMotionEnabled();
  const { dur, ease, reveal } = useMotionTokens();

  useGSAP(
    () => {
      const frame = ref.current;
      if (!frame) return;
      if (!enabled) {
        frame.dataset.revealReady = "";
        return;
      }

      gsap
        .timeline({
          defaults: { duration: dur.slow, ease: ease.out },
          scrollTrigger:
            trigger === "scroll" ? { trigger: frame, start: reveal.start, once: true } : undefined,
        })
        .fromTo(
          frame,
          { clipPath: "inset(100% 0% 0% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", clearProps: "clipPath" },
        )
        .fromTo("img", { scale: 1.15 }, { scale: 1 }, 0);
      frame.dataset.revealReady = "";
    },
    {
      scope: ref,
      dependencies: [enabled, trigger, dur.slow, ease.out, reveal.start],
      revertOnUpdate: true,
    },
  );

  return (
    <div ref={ref} data-reveal={trigger} className={cn("relative overflow-hidden", className)}>
      <Image
        src={src}
        alt={alt}
        sizes={sizes}
        priority={priority}
        fill
        className={cn("object-cover", imageClassName)}
      />
    </div>
  );
}
