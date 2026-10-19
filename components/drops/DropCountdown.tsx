"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils/cn";

type Props = {
  /** ISO timestamp of go-live. */
  target: string;
  className?: string;
};

// One clock for every countdown on the page. It only needs to tick once a minute (the boxes show
// minutes), but a 1 s tick keeps the flip to "live" prompt; the work per tick is trivial.
function subscribe(onTick: () => void) {
  const id = window.setInterval(onTick, 1000);
  return () => window.clearInterval(id);
}
const nowInSeconds = () => Math.floor(Date.now() / 1000);
// The server renders "--"; the browser fills in real numbers after hydration (no mismatch).
const serverSnapshot = () => null;

const units = [
  ["Days", 86_400],
  ["Hrs", 3_600],
  ["Min", 60],
] as const;

// Drop countdown: outlined boxes with big numerals. Screen readers get the go-live
// time from the sticker above (see DropHero); the digits are hidden so nothing announces a tick.
export function DropCountdown({ target, className }: Props) {
  const now = useSyncExternalStore(subscribe, nowInSeconds, serverSnapshot);
  const remaining =
    now === null ? null : Math.max(0, Math.floor(new Date(target).getTime() / 1000) - now);

  if (remaining === 0) {
    return (
      <p className={cn("font-display font-bold text-xl text-accent", className)} role="status">
        It&rsquo;s live. Refresh to shop.
      </p>
    );
  }

  return (
    <div aria-hidden className={cn("flex gap-2 sm:gap-3", className)}>
      {units.map(([label, size], i) => {
        const value =
          remaining === null
            ? "--"
            : String(
                Math.floor((i === 0 ? remaining : remaining % units[i - 1][1]) / size),
              ).padStart(2, "0");
        return (
          <span key={label} className="w-20 rounded-md border border-accent px-3 py-2 sm:w-24">
            <span className="block font-display font-bold text-2xl tabular-nums">{value}</span>
            <span className="block text-xs font-bold tracking-widest uppercase">{label}</span>
          </span>
        );
      })}
    </div>
  );
}
