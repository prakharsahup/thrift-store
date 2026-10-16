import type { FeaturedDrop } from "@/lib/server/catalogue";

/** A live drop leads the home page for this long after go-live, then the page goes back to stock. */
const LIVE_SPOTLIGHT_MS = 7 * 24 * 60 * 60 * 1000;

export type DropPhase =
  | { phase: "upcoming"; drop: FeaturedDrop }
  | { phase: "live"; drop: FeaturedDrop }
  | { phase: "none" };

/** Hybrid home: which drop (if any) the hero should be about right now. */
export function dropPhase(drop: FeaturedDrop | null, now = Date.now()): DropPhase {
  if (!drop) return { phase: "none" };
  if (!drop.isLive) return { phase: "upcoming", drop };
  return now - new Date(drop.goLiveAt).getTime() < LIVE_SPOTLIGHT_MS
    ? { phase: "live", drop }
    : { phase: "none" };
}

const stickerTime = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

/** "Sun · 10:49 am" in India time (same on server and client). */
export function dropTimeLabel(goLiveAt: string): string {
  const parts = stickerTime.formatToParts(new Date(goLiveAt));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const minute = get("minute");
  const time = `${get("hour")}${minute === "00" ? "" : `:${minute}`} ${get("dayPeriod")}`.trim();
  return `${get("weekday")} · ${time}`;
}

/** "1 piece" / "12 pieces". */
export const piecesLabel = (n: number) => `${n} ${n === 1 ? "piece" : "pieces"}`;
