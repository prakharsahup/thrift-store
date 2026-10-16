"use client";

import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

type Props = {
  /** Tab label, e.g. "Men" or "Brand". */
  label: string;
  /** Unique id; the panel's DOM id is derived from it. */
  id: string;
  /** Path prefixes that belong to this section; the tab is underlined on them. */
  activePaths?: readonly string[];
  /** The panel content, rendered on the server. */
  children: React.ReactNode;
};

// Hover intent: a short delay before opening stops a panel flashing when the mouse only passes
// over the tab, and a delay before closing forgives a wobbly path into the panel.
const OPEN_DELAY_MS = 80;
const CLOSE_DELAY_MS = 160;

// One header tab with a full-width panel underneath (Men, Women, Unisex, Brand). Mouse users open
// it by hovering; keyboard and touch users press the tab. Esc closes it and returns focus to the
// tab; tabbing out of it, or following any link in it, closes it too.
export function NavDropdown({ label, id, activePaths = [], children }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const button = useRef<HTMLButtonElement>(null);
  const panelId = `${id}-panel`;
  const active = activePaths.some((p) => pathname === p || pathname.startsWith(p));

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Any navigation (a link, the back button) closes the panel: adjust state during render rather
  // than in an effect, so the closed panel never paints on the new page.
  const [shownFor, setShownFor] = useState(pathname);
  if (shownFor !== pathname) {
    setShownFor(pathname);
    setOpen(false);
  }

  function setOpenAfter(next: boolean, delay: number) {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(next), delay);
  }

  function setOpenNow(next: boolean) {
    window.clearTimeout(timer.current);
    setOpen(next);
  }

  return (
    <div
      className="flex h-full items-center"
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setOpenAfter(true, OPEN_DELAY_MS);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") setOpenAfter(false, CLOSE_DELAY_MS);
      }}
      onBlur={(event) => {
        if (open && !event.currentTarget.contains(event.relatedTarget)) setOpenNow(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          setOpenNow(false);
          button.current?.focus();
        }
      }}
      // A click on a link inside the panel closes it at once (same-page links don't navigate).
      onClick={(event) => {
        if (event.target instanceof Element && event.target.closest(`#${panelId} a`)) {
          setOpenNow(false);
        }
      }}
    >
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        data-active={active || open}
        onClick={() => setOpenNow(!open)}
        className={cn(
          "relative flex h-full items-center gap-1 px-2 text-xs font-bold tracking-widest whitespace-nowrap text-accent uppercase xl:px-3",
          "after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-accent after:transition-transform",
          "hover:text-fg data-[active=true]:after:scale-x-100",
        )}
      >
        {label}
        <ChevronDown
          aria-hidden
          className={cn("size-4 transition-transform", open && "rotate-180")}
        />
      </button>

      <div
        id={panelId}
        data-open={open}
        className="pointer-events-none invisible absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] -translate-y-1 overflow-y-auto border-b border-border bg-bg opacity-0 transition-[opacity,translate,visibility] duration-200 data-[open=true]:pointer-events-auto data-[open=true]:visible data-[open=true]:translate-y-0 data-[open=true]:opacity-100"
      >
        {children}
      </div>
    </div>
  );
}
