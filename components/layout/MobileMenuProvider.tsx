"use client";

import { createContext, use, useMemo, useState } from "react";

type MobileMenuState = {
  open: boolean;
  show: () => void;
  close: () => void;
};

const MobileMenuContext = createContext<MobileMenuState | null>(null);

type Props = { children: React.ReactNode };

// Shared open state, so both the header hamburger and the bottom nav's "Categories" open the menu.
export function MobileMenuProvider({ children }: Props) {
  const [open, setOpen] = useState(false);

  const value = useMemo(
    () => ({ open, show: () => setOpen(true), close: () => setOpen(false) }),
    [open],
  );

  return <MobileMenuContext value={value}>{children}</MobileMenuContext>;
}

export function useMobileMenu(): MobileMenuState {
  const state = use(MobileMenuContext);
  if (!state) throw new Error("useMobileMenu must be used inside <MobileMenuProvider>.");
  return state;
}
