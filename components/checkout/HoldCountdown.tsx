"use client";

import { useSyncExternalStore } from "react";
import { Clock } from "lucide-react";

function subscribe(onTick: () => void) {
  const id = window.setInterval(onTick, 1000);
  return () => window.clearInterval(id);
}
const nowInSeconds = () => Math.floor(Date.now() / 1000);
const serverSnapshot = () => null;

/** Seconds until `until` (ISO), ticking once a second; null during server render. */
export function useSecondsLeft(until: string): number | null {
  const now = useSyncExternalStore(subscribe, nowInSeconds, serverSnapshot);
  if (now === null) return null;
  return Math.max(0, Math.floor(new Date(until).getTime() / 1000) - now);
}

type Props = { secondsLeft: number | null };

// "Held for you: 12:34". Screen readers get a coarse, polite update each minute rather than every
// second; the ticking digits are hidden from them.
export function HoldCountdown({ secondsLeft }: Props) {
  const minutes = secondsLeft === null ? null : Math.floor(secondsLeft / 60);
  const clock =
    secondsLeft === null
      ? "--:--"
      : `${String(minutes).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;
  const urgent = secondsLeft !== null && secondsLeft < 120;

  return (
    <div className="flex items-center gap-3 rounded-md bg-surface px-4 py-3 text-sm">
      <Clock aria-hidden className={urgent ? "size-5 text-sale" : "size-5 text-muted"} />
      <p className="flex-1">
        These pieces are held for you for{" "}
        <span aria-hidden className="font-display font-bold tabular-nums">
          {clock}
        </span>
        <span className="sr-only" aria-live="polite">
          {minutes === null ? "" : `${minutes + 1} minute${minutes === 0 ? "" : "s"} or less`}
        </span>
      </p>
    </div>
  );
}
