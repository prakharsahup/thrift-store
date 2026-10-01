"use client";

import { Menu } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useMobileMenu } from "./MobileMenuProvider";

type Props = { className?: string };

export function MobileMenuButton({ className }: Props) {
  const { open, show } = useMobileMenu();

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={show}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-md hover:bg-surface",
        className,
      )}
    >
      <Menu aria-hidden className="size-6" />
      <span className="sr-only">Open menu</span>
    </button>
  );
}
