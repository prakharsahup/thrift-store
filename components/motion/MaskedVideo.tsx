"use client";

import { useEffect, useRef } from "react";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils/cn";
import { useMotionEnabled } from "./MotionProvider";
import { useMotionTokens } from "./MotionTokensProvider";

type Props = {
  mp4: string;
  webm?: string;
  poster: string;
  /** Describe the video if it carries meaning; omit for purely decorative loops. */
  label?: string;
  shape?: "circle" | "pill";
  className?: string;
};

// Video in a circle/pill that grows from 0.6× to 1× as it scrolls into view (MOTION.md §5.7).
// It is never autoplayed by the browser: JS plays it only while it is on screen and motion is on,
// so with motion off (or no JS) only the poster shows, and off-screen videos don't download.
export function MaskedVideo({ mp4, webm, poster, label, shape = "circle", className }: Props) {
  const scope = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const enabled = useMotionEnabled();
  const { ease } = useMotionTokens();

  useGSAP(
    () => {
      if (!enabled) return;
      gsap.fromTo(
        "[data-video-mask]",
        { scale: 0.6 },
        {
          scale: 1,
          ease: ease.scrub,
          scrollTrigger: {
            trigger: scope.current,
            start: "top bottom",
            end: "center center",
            scrub: true,
          },
        },
      );
    },
    { scope, dependencies: [enabled, ease.scrub], revertOnUpdate: true },
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!enabled) {
      // load() resets the element, so the poster frame shows again instead of a paused frame.
      if (video.currentTime > 0) video.load();
      return;
    }

    video.muted = true; // required for scripted playback on iOS
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        video.play().catch(() => {
          // Playback refused (e.g. data saver / low-power mode): the poster stays, which is fine.
        });
      } else {
        video.pause();
      }
    });
    observer.observe(video);
    return () => {
      observer.disconnect();
      video.pause();
    };
  }, [enabled]);

  return (
    <div ref={scope} className={cn("flex justify-center", className)}>
      <div
        data-video-mask
        className={cn(
          "isolate w-full overflow-hidden rounded-full bg-surface",
          shape === "circle" ? "aspect-square max-w-xl" : "aspect-[2/1]",
        )}
      >
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="none"
          poster={poster}
          aria-label={label}
          aria-hidden={label ? undefined : true}
          className="size-full object-cover"
        >
          {webm ? <source src={webm} type="video/webm" /> : null}
          <source src={mp4} type="video/mp4" />
        </video>
      </div>
    </div>
  );
}
