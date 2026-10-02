import type { ProductCondition } from "@/lib/config/conditions";

/** Fill and text classes for each condition grade, shared by ConditionBadge and ProductCard. */
export const conditionTone: Record<ProductCondition, string> = {
  new_with_tags: "bg-primary text-primary-fg",
  like_new: "bg-accent text-accent-fg",
  good: "bg-surface text-fg",
  fair: "bg-border text-fg",
};
