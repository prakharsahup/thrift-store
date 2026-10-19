"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { Input } from "@/components/ui/Input";
import {
  addProductImages,
  deleteProductImage,
  reorderProductImages,
  updateImageAlt,
} from "@/lib/actions/admin/products";
import { uploadCatalogueImage } from "@/lib/admin/upload";
import { cn } from "@/lib/utils/cn";

type Photo = { id: string; url: string; alt: string };

type Props = { productId: string; productTitle: string; images: Photo[] };

// A product's gallery: upload several photos at once, drag to reorder (or use the arrow buttons,
// which work with a keyboard), describe each one, delete. The first photo is the card image and
// the second is shown on hover (CLAUDE.md §5).
export function ImageManager({ productId, productTitle, images }: Props) {
  const router = useRouter();
  const [photos, setPhotos] = useState(images);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // A server refresh (after upload or delete) brings new props: start from them again.
  const [seen, setSeen] = useState(images);
  if (seen !== images) {
    setSeen(images);
    setPhotos(images);
  }

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setMessage(null);
    const uploaded: { url: string; alt: string }[] = [];
    const problems: string[] = [];
    for (const [i, file] of [...files].entries()) {
      const result = await uploadCatalogueImage(file, `products/${productId}`);
      if (result.ok)
        uploaded.push({ url: result.url, alt: `${productTitle}, photo ${photos.length + i + 1}` });
      else problems.push(result.message);
    }
    if (uploaded.length) {
      const saved = await addProductImages(productId, uploaded);
      if (!saved.ok) problems.push(saved.message);
    }
    setBusy(false);
    if (problems.length) setMessage({ tone: "error", text: problems.join(" ") });
    else
      setMessage({
        tone: "info",
        text: `${uploaded.length} photo${uploaded.length === 1 ? "" : "s"} added. Check each description.`,
      });
    router.refresh();
  }

  async function move(from: number, to: number) {
    if (to < 0 || to >= photos.length || from === to) return;
    const next = [...photos];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setPhotos(next);
    const result = await reorderProductImages(
      productId,
      next.map((p) => p.id),
    );
    if (!result.ok) {
      setPhotos(photos);
      setMessage({ tone: "error", text: result.message });
    } else {
      setMessage({ tone: "info", text: `Moved to position ${to + 1}.` });
    }
  }

  async function saveAlt(photo: Photo, alt: string) {
    if (alt === photo.alt) return;
    const result = await updateImageAlt(photo.id, alt);
    if (!result.ok) setMessage({ tone: "error", text: result.message });
    else setPhotos((list) => list.map((p) => (p.id === photo.id ? { ...p, alt } : p)));
  }

  async function remove(photo: Photo) {
    setBusy(true);
    const result = await deleteProductImage(photo.id);
    setBusy(false);
    if (!result.ok) {
      setMessage({ tone: "error", text: result.message });
      return;
    }
    setMessage({ tone: "info", text: "Photo deleted." });
    router.refresh();
  }

  return (
    <section aria-labelledby="photos-heading" className="max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <h2 id="photos-heading" className="text-lg font-bold">
          Photos ({photos.length})
        </h2>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => fileInput.current?.click()}
        >
          {busy ? "Working…" : "Upload photos"}
        </Button>
        <input
          ref={fileInput}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            void upload(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <p
        role={message?.tone === "error" ? "alert" : "status"}
        className={cn("mb-4 text-sm", message?.tone === "error" ? "text-sale" : "text-muted")}
      >
        {message?.text ??
          "Drag to reorder, or use the arrows. The first photo is the main one; the second shows on hover."}
      </p>

      {photos.length === 0 ? (
        <p className="rounded-lg border border-dashed border-input p-8 text-center text-sm text-muted">
          No photos yet. Pieces without photos look broken in the shop — add at least two.
        </p>
      ) : (
        <ol className="space-y-3">
          {photos.map((photo, index) => (
            <li
              key={photo.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null) void move(dragIndex, index);
                setDragIndex(null);
              }}
              onDragEnd={() => setDragIndex(null)}
              className={cn(
                "flex items-center gap-3 rounded-lg border border-border bg-bg p-3",
                dragIndex === index && "opacity-50",
              )}
            >
              <GripVertical aria-hidden className="size-5 shrink-0 cursor-grab text-muted" />
              <div className="relative aspect-3/4 w-16 shrink-0 overflow-hidden rounded-sm bg-surface">
                <ImageWithFallback
                  src={photo.url}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-xs font-semibold text-muted">
                  {index === 0 ? "Main photo" : index === 1 ? "Hover photo" : `Photo ${index + 1}`}
                </p>
                <label htmlFor={`alt-${photo.id}`} className="sr-only">
                  Description of photo {index + 1}
                </label>
                <Input
                  id={`alt-${photo.id}`}
                  defaultValue={photo.alt}
                  placeholder="Describe the photo"
                  onBlur={(e) => void saveAlt(photo, e.target.value.trim())}
                />
              </div>
              <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={index === 0}
                  aria-label={`Move photo ${index + 1} up`}
                  onClick={() => void move(index, index - 1)}
                >
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={index === photos.length - 1}
                  aria-label={`Move photo ${index + 1} down`}
                  onClick={() => void move(index, index + 1)}
                >
                  <ArrowDown />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={busy}
                  aria-label={`Delete photo ${index + 1}`}
                  onClick={() => void remove(photo)}
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
