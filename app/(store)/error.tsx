"use client";

import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";

type Props = { error: Error & { digest?: string }; reset: () => void };

// Shared by every store page (each segment's error.tsx re-exports this).
export default function StoreError({ reset }: Props) {
  return (
    <div className="site-container py-16 md:py-24">
      <p className="text-xs font-semibold tracking-widest text-muted uppercase">Something broke</p>
      <h1 className="mt-3 text-2xl font-bold md:text-3xl">
        We couldn&rsquo;t load the shop just now.
      </h1>
      <p className="mt-4 max-w-prose text-base text-muted">
        It&rsquo;s on our side, not yours. Try again in a moment.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/" variant="outline">
          Back to home
        </ButtonLink>
      </div>
    </div>
  );
}
