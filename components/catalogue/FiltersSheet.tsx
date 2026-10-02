"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
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
      <Button
        variant="outline"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="lg:hidden"
      >
        <SlidersHorizontal aria-hidden />
        Filters
        {activeCount > 0 ? (
          <span className="rounded-sm bg-primary px-1.5 text-xs text-primary-fg">
            {activeCount}
          </span>
        ) : null}
      </Button>

      <Sheet open={open} onClose={() => setOpen(false)} label="Filters" side="bottom">
        <div className="flex max-h-[85dvh] flex-col">
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2">
            <p className="font-display text-lg font-bold">Filters</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              autoFocus
              className="-mr-2"
            >
              <X aria-hidden />
              <span className="sr-only">Close filters</span>
            </Button>
          </div>
          <div className="overflow-y-auto overscroll-contain px-4">
            <FilterForm {...formProps} idPrefix="sheet" onSubmitted={() => setOpen(false)} />
          </div>
        </div>
      </Sheet>
    </>
  );
}
