import { conditions, type ProductCondition } from "@/lib/config/conditions";
import { cn } from "@/lib/utils/cn";

type Props = { condition: ProductCondition; className?: string };

const tone: Record<ProductCondition, string> = {
  new_with_tags: "bg-primary text-primary-fg",
  like_new: "bg-accent text-accent-fg",
  good: "bg-surface text-fg",
  fair: "bg-border text-fg",
};

// Condition grade plus what it means, always shown together (CLAUDE.md §4).
export function ConditionBadge({ condition, className }: Props) {
  const grade = conditions[condition];
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <span
        className={cn(
          "shrink-0 rounded-sm px-2 py-1 text-xs font-bold tracking-wide uppercase",
          tone[condition],
        )}
      >
        {grade.label}
      </span>
      <p className="text-sm text-muted">{grade.description}</p>
    </div>
  );
}
