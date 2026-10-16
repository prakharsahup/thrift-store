import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// tailwind-merge only knows Tailwind's default scale. Our @theme adds `text-hero` (a font size), so
// declare it; otherwise `cn("text-accent", "text-hero")` would drop the colour as a "conflict".
const twMerge = extendTailwindMerge({
  extend: { classGroups: { "font-size": [{ text: ["hero"] }] } },
});

/** Merges class names and resolves conflicting Tailwind utilities (used by shadcn/ui). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
