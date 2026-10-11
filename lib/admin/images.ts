import { getSupabasePublicEnv } from "@/lib/env";

// The public "catalogue" bucket (supabase/migrations/…_admin.sql). Shared by the browser (uploads)
// and the server (deleting files when their image row goes).

export const CATALOGUE_BUCKET = "catalogue";
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;

function publicPrefix(): string {
  return `${getSupabasePublicEnv().url}/storage/v1/object/public/${CATALOGUE_BUCKET}/`;
}

/** The bucket path of one of our uploaded files, or null for any other URL (e.g. placeholders). */
export function cataloguePathFromUrl(url: string): string | null {
  const prefix = publicPrefix();
  return url.startsWith(prefix) ? decodeURIComponent(url.slice(prefix.length)) : null;
}

/** Why a file can't be uploaded, or null if it's fine. */
export function imageFileProblem(file: File): string | null {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return `${file.name}: use a JPG, PNG, WebP or AVIF image.`;
  }
  if (file.size > MAX_IMAGE_BYTES) return `${file.name}: images must be under 10 MB.`;
  return null;
}
