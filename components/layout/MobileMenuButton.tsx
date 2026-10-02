"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useMobileMenu } from "./MobileMenuProvider";

type Props = { className?: string };

export function MobileMenuButton({ className }: Props) {
  const { open, show } = useMobileMenu();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={show}
      className={className}
    >
      <Menu aria-hidden />
      <span className="sr-only">Open menu</span>
    </Button>
  );
}
