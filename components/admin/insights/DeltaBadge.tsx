import { cn } from "@/lib/utils/cn";
import { formatChange } from "@/lib/utils/insights";

type Props = {
  /** Relative change (0.12 = +12%), or null when there's nothing to compare. */
  change: number | null;
  /** For numbers where going down is good, like refunds. */
  lowerIsBetter?: boolean;
};

// ▲/▼ with the percentage: the arrow and sign carry the meaning, colour only reinforces it.
export function DeltaBadge({ change, lowerIsBetter = false }: Props) {
  if (change === null) return <span className="text-xs text-muted">No earlier data</span>;
  const rounded = Math.round(change * 100);
  if (rounded === 0) return <span className="text-xs font-semibold text-muted">→ No change</span>;
  const up = change > 0;
  const good = up !== lowerIsBetter;
  return (
    <span className={cn("text-xs font-semibold", good ? "text-accent" : "text-sale")}>
      <span aria-hidden>{up ? "▲" : "▼"} </span>
      <span className="sr-only">{up ? "Up" : "Down"} </span>
      {formatChange(change)}
    </span>
  );
}
