"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { uploadCatalogueImage } from "@/lib/admin/upload";

type Props = {
  name: string;
  label: string;
  /** Storage folder for uploads, e.g. "banners". */
  folder: string;
  defaultValue?: string | null;
  error?: string;
  required?: boolean;
};

// One image for a banner, drop or category: upload a file or paste a URL, with a preview.
export function ImageUrlField({ name, label, folder, defaultValue, error, required }: Props) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const id = `field-${name}`;
  const message = uploadError ?? error;

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setUploadError(null);
    const result = await uploadCatalogueImage(file, folder);
    setBusy(false);
    if (result.ok) setUrl(result.url);
    else setUploadError(result.message);
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold">
        {label}
        {required ? null : <span className="font-normal text-muted"> (optional)</span>}
      </label>
      <div className="flex gap-2">
        <Input
          id={id}
          name={name}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          aria-invalid={message ? true : undefined}
          aria-describedby={message ? `${id}-error` : undefined}
        />
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => fileInput.current?.click()}
        >
          {busy ? "Uploading…" : "Upload"}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            void upload(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      {message ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-sale">
          {message}
        </p>
      ) : null}
      {/^https?:\/\//.test(url) ? (
        <div className="relative mt-3 aspect-video w-full max-w-xs overflow-hidden rounded-md bg-surface">
          <Image src={url} alt="" fill sizes="320px" className="object-cover" unoptimized />
        </div>
      ) : null}
    </div>
  );
}
