"use client";

import Link from "next/link";

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
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-fg"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-md border border-fg px-5 text-sm font-semibold"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
