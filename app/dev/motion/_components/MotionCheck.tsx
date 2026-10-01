"use client";

import { useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { useMotionEnabled } from "@/components/motion/MotionProvider";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { useMotionTokens } from "@/components/motion/MotionTokensProvider";

const boxes = ["Graded", "Measured", "One of one", "Pre-loved"] as const;

// Proves the motion foundation: tokens drive the tween, and with motion off the boxes
// render in their final state with no animation.
export function MotionCheck() {
  const scope = useRef<HTMLDivElement>(null);
  const enabled = useMotionEnabled();
  const [replays, setReplays] = useState(0);
  const { dur, ease, stagger } = useMotionTokens();

  useGSAP(
    () => {
      if (!enabled) return;
      // Hidden start state is set here in JS, never in CSS, so a failed script can't hide content.
      gsap.from("[data-box]", {
        yPercent: 110,
        opacity: 0,
        duration: dur.base,
        ease: ease.out,
        stagger: stagger.items,
      });
    },
    {
      scope,
      dependencies: [enabled, replays, dur.base, ease.out, stagger.items],
      revertOnUpdate: true,
    },
  );

  return (
    <div>
      <div ref={scope} className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {boxes.map((label) => (
          <div key={label} className="overflow-hidden rounded-md">
            <div
              data-box
              className="flex h-24 items-end rounded-md bg-primary p-3 font-display text-lg font-bold text-primary-fg"
            >
              {label}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <button
          type="button"
          onClick={() => setReplays((n) => n + 1)}
          disabled={!enabled}
          className="inline-flex items-center gap-2 rounded-md border border-fg px-3 py-2 font-medium disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RotateCcw aria-hidden className="size-4" />
          Replay
        </button>
        <p className="text-muted" aria-live="polite">
          Motion is <strong className="text-fg">{enabled ? "on" : "off"}</strong>
          {enabled ? "." : " — showing the final state."}
        </p>
      </div>
    </div>
  );
}
