import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Props = {
  items: readonly string[];
  /** Seconds per loop. */
  speed?: number;
  direction?: "left" | "right";
  separator?: ReactNode;
  /** Accessible name for the list, e.g. "What we sell". */
  label?: string;
  className?: string;
};

// Infinite strip, CSS only (MOTION.md §5.2): two identical copies slide by -50% and loop. The copy is
// aria-hidden, so screen readers read the list once. Pauses on hover; stops with `no-motion`.
export function Marquee({
  items,
  speed = 30,
  direction = "left",
  separator = "·",
  label,
  className,
}: Props) {
  const style: CSSProperties & Record<"--speed", string> = { "--speed": `${speed}s` };

  const renderCopy = (hidden: boolean) => (
    <ul
      aria-label={hidden ? undefined : label}
      aria-hidden={hidden || undefined}
      className="marquee-copy"
    >
      {items.map((item) => (
        <li key={item} className="flex items-center">
          {item}
          <span aria-hidden className="marquee-separator">
            {separator}
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className={cn("marquee", className)} data-dir={direction} style={style}>
      <div className="marquee-track">
        {renderCopy(false)}
        {renderCopy(true)}
      </div>
    </div>
  );
}
