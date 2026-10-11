"use client";

import { Button } from "@/components/ui/Button";

type Props = { error: Error & { digest?: string }; reset: () => void };

// Shared by every admin page (each segment's error.tsx re-exports this).
export default function AdminError({ error, reset }: Props) {
  return (
    <div className="max-w-prose py-8">
      <h1 className="text-2xl font-bold">That didn&rsquo;t load.</h1>
      <p className="mt-3 text-muted">
        Nothing was changed. Try again; if it keeps happening, check the server log
        {error.digest ? ` for error ${error.digest}` : ""}.
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
