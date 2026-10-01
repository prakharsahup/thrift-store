"use client";

import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useMotionSettings } from "./MotionProvider";

type Props = {
  /** Icon-only button (header). The label stays available to screen readers and as a tooltip. */
  compact?: boolean;
  className?: string;
};

// The accessible name stays "Pause animations"; aria-pressed carries the state. Changing both the
// label and the pressed state confuses screen readers, so only the icon swaps visually.
export function MotionToggle({ compact = false, className }: Props) {
  const { enabled, setEnabled } = useMotionSettings();
  const paused = !enabled;
  const Icon = paused ? Play : Pause;

  return (
    <button
      type="button"
      aria-pressed={paused}
      title={compact ? "Pause animations" : undefined}
      onClick={() => setEnabled(paused)}
      className={cn(
        compact
          ? "inline-flex size-10 items-center justify-center rounded-md hover:bg-surface aria-pressed:bg-surface"
          : "inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium transition-colors hover:border-fg aria-pressed:bg-fg aria-pressed:text-bg",
        className,
      )}
    >
      <Icon aria-hidden className={compact ? "size-5" : "size-4"} />
      <span className={compact ? "sr-only" : undefined}>Pause animations</span>
    </button>
  );
}
