"use client";

import { useSyncExternalStore } from "react";

type Props = {
  /** ISO timestamp of go-live. */
  target: string;
  className?: string;
};

// One clock for every countdown on the page, ticking once a second.
function subscribe(onTick: () => void) {
  const id = window.setInterval(onTick, 1000);
  return () => window.clearInterval(id);
}
const nowInSeconds = () => Math.floor(Date.now() / 1000);
// The server renders placeholders; the browser fills in real numbers after hydration.
const serverSnapshot = () => null;

// Shown in India time on server and client alike, so the text never mismatches during hydration.
const goLiveFormat = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

const units = [
  ["days", 86_400],
  ["hrs", 3_600],
  ["min", 60],
  ["sec", 1],
] as const;

// Drop countdown. Screen readers get the go-live date once; the ticking digits are hidden from
// them so they don't announce every second.
export function Countdown({ target, className }: Props) {
  const now = useSyncExternalStore(subscribe, nowInSeconds, serverSnapshot);
  const targetSeconds = Math.floor(new Date(target).getTime() / 1000);
  const remaining = now === null ? null : Math.max(0, targetSeconds - now);

  return (
    <div className={className}>
      <p className="text-sm">
        Goes live <time dateTime={target}>{goLiveFormat.format(new Date(target))} IST</time>
      </p>
      {remaining === 0 ? (
        <p className="mt-3 font-display text-xl font-bold">It&rsquo;s live — refresh to shop.</p>
      ) : (
        <div aria-hidden className="mt-3 flex gap-2">
          {units.map(([label, size], i) => {
            const value =
              remaining === null
                ? "--"
                : String(
                    Math.floor((i === 0 ? remaining : remaining % units[i - 1][1]) / size),
                  ).padStart(2, "0");
            return (
              <span
                key={label}
                className="flex w-16 flex-col items-center rounded-md border border-bg/30 py-2"
              >
                <span className="font-display text-2xl font-bold tabular-nums">{value}</span>
                <span className="text-xs uppercase opacity-80">{label}</span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
