import { createClient } from "@/lib/supabase/client";
import { CATALOGUE_BUCKET, imageFileProblem } from "./images";

/**
 * Uploads an image from the admin's browser to the catalogue bucket (storage RLS: admins only)
 * and returns its public URL. `folder` groups files, e.g. "products/<id>" or "banners".
 */
export async function uploadCatalogueImage(
  file: File,
  folder: string,
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const problem = imageFileProblem(file);
  if (problem) return { ok: false, message: problem };

  const extension = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const path = `${folder}/${crypto.randomUUID()}.${extension}`;
  const storage = createClient().storage.from(CATALOGUE_BUCKET);
  const { error } = await storage.upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) return { ok: false, message: `${file.name}: upload failed (${error.message}).` };
  return { ok: true, url: storage.getPublicUrl(path).data.publicUrl };
}
