"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";

const FALLBACK_SRC = "/placeholders/product-fallback.svg";

type Props = Omit<ImageProps, "src"> & { src: string | null | undefined };

// Product photos are mostly hotlinked (Vendoo import) or admin-pasted URLs, so they can be
// missing or fail to load. Swaps to a local placeholder in either case instead of a broken-image
// icon — never a third-party fallback host (CLAUDE.md §2.1), the placeholder ships with the app.
export function ImageWithFallback({ src, alt, onError, ...props }: Props) {
  const [failed, setFailed] = useState(false);

  return (
    <Image
      {...props}
      src={!src || failed ? FALLBACK_SRC : src}
      alt={alt}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
    />
  );
}
