"use client";

import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";

type Props = { error: Error & { digest?: string }; reset: () => void };

export default function BrandError({ reset }: Props) {
  return (
    <div className="site-container py-16 md:py-24">
      <p className="text-xs font-semibold tracking-widest text-muted uppercase">Something broke</p>
      <h1 className="mt-3 text-2xl font-bold md:text-3xl">This page didn&rsquo;t load properly.</h1>
      <p className="mt-4 max-w-prose text-base text-muted">
        It&rsquo;s on our side, not yours. Try again, and if it keeps happening, come back in a few
        minutes.
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
