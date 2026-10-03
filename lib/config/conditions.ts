import type { Database } from "@/lib/supabase/types";

export type ProductCondition = Database["public"]["Enums"]["product_condition"];

// Condition grades and what each one promises (CLAUDE.md §4). Shown on cards and the PDP.
export const conditions = {
  new_with_tags: {
    label: "New with tags",
    description: "Never worn. The original tags are still attached.",
  },
  like_new: {
    label: "Like new",
    description: "Worn once or twice, with no visible wear.",
  },
  good: {
    label: "Good",
    description: "Gently worn with light signs of use. Any flaws are listed and photographed.",
  },
  fair: {
    label: "Fair",
    description: "Visible wear such as fading or small marks — all listed and photographed.",
  },
} as const satisfies Record<ProductCondition, { label: string; description: string }>;
