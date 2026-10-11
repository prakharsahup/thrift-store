import "server-only";
import { revalidatePath } from "next/cache";

/**
 * Refreshes cached storefront pages after an admin edit or a sale (CLAUDE.md §11). Product pages,
 * the home page and the gender landings are cached for 60 s; listings and search are dynamic.
 */
export function revalidateStorefront(productSlugs: string[] = []): void {
  for (const slug of productSlugs) revalidatePath(`/p/${slug}`);
  revalidatePath("/");
  revalidatePath("/[gender]", "page");
}

/** Everything (categories, drops and banners appear in the header, footer and many pages). */
export function revalidateWholeStore(): void {
  revalidatePath("/", "layout");
}
