import type { Database } from "@/lib/supabase/types";

export type ProductCondition = Database["public"]["Enums"]["product_condition"];

// Condition grades and what each one promises (CLAUDE.md §4). Shown on cards and the PDP.
export const conditions = {
  new_with_tags: {
    label: "New with tags",
    description: "Never worn. The original tags are still attached.",
  },
  // Retired grade (owner decision, 2026-10-15): pieces once graded "Like new" are now "Good". The
  // enum value stays in the database, so anything still carrying it reads as Good.
  like_new: {
    label: "Good",
    description: "Gently worn with light signs of use. Any flaws are listed and photographed.",
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

/** The grades a piece can be given, best first. */
export const selectableConditions = [
  "new_with_tags",
  "good",
  "fair",
] as const satisfies readonly ProductCondition[];
