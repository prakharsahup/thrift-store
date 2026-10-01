"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { FilterForm } from "./FilterForm";

type Props = Omit<React.ComponentProps<typeof FilterForm>, "idPrefix" | "autoSubmit"> & {
  activeCount: number;
};

// Mobile/tablet filters in a bottom sheet (CLAUDE.md §8). Hidden from lg, where the sidebar shows.
export function FiltersSheet({ activeCount, ...formProps }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold hover:border-fg lg:hidden"
      >
        <SlidersHorizontal aria-hidden className="size-4" />
        Filters
        {activeCount > 0 ? (
          <span className="rounded-sm bg-fg px-1.5 text-xs text-bg">{activeCount}</span>
        ) : null}
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} label="Filters" side="bottom">
        <div className="flex max-h-[85dvh] flex-col">
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2">
            <p className="font-display text-lg font-bold">Filters</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              autoFocus
              className="-mr-2 inline-flex size-10 items-center justify-center rounded-md hover:bg-surface"
            >
              <X aria-hidden className="size-5" />
              <span className="sr-only">Close filters</span>
            </button>
          </div>
          <div className="overflow-y-auto overscroll-contain px-4">
            <FilterForm {...formProps} idPrefix="sheet" onSubmitted={() => setOpen(false)} />
          </div>
        </div>
      </Sheet>
    </>
  );
}
