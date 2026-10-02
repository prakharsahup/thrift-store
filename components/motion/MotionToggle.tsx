"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { useMotionSettings } from "./MotionProvider";

type Props = { className?: string };

// A switch, not a pause button: the name stays "Animations" and aria-checked carries on/off, so
// it never contradicts itself when reduced motion turns animations off by default.
// Lives in the footer only (it read as a media control in the header).
export function MotionToggle({ className }: Props) {
  const { enabled, setEnabled } = useMotionSettings();

  return (
    <Button
      variant="outline"
      size="sm"
      role="switch"
      aria-checked={enabled}
      onClick={() => setEnabled(!enabled)}
      className={cn("gap-2", className)}
    >
      Animations
      <span aria-hidden className="relative h-4 w-7 rounded-full border-2 border-current">
        <span
          // Thumb right = on. bg-current follows the text colour, so it inverts with the hover state.
          className={cn(
            "absolute top-0.5 left-0.5 size-2 rounded-full bg-current transition-transform",
            enabled ? "translate-x-3" : "opacity-50",
          )}
        />
      </span>
    </Button>
  );
}
