"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Accessible name for the drawer, e.g. "Menu" or "Cart". */
  label: string;
  side?: "left" | "right" | "bottom";
  className?: string;
  children: React.ReactNode;
};

// Slide-out drawer on the native <dialog>. showModal() makes the rest of the page inert (focus is
// trapped), Esc closes it, and the browser returns focus to the trigger. Styles: `.sheet` in globals.css.
export function Sheet({ open, onClose, label, side = "left", className, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      data-side={side}
      className={cn("sheet", className)}
      // Fires for Esc and for close() calls, so the parent's state always follows the dialog.
      onClose={onClose}
      // A click on the dialog element itself (not its content) is a click on the backdrop.
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
    >
      <div className="h-full">{children}</div>
    </dialog>
  );
}
