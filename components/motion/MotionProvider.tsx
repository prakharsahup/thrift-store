"use client";

import { createContext, use, useEffect, useMemo, useSyncExternalStore } from "react";
import { getMotionEnabled, setMotionEnabled, subscribeMotion } from "@/lib/motion/preference";

type MotionSettings = {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
};

const MotionContext = createContext<MotionSettings | null>(null);

type Props = { children: React.ReactNode };

// The server (and hydration) render uses `false`: components render their final, static state,
// so content is visible without JS. Animations start once the client confirms motion is allowed.
const getServerSnapshot = () => false;

export function MotionProvider({ children }: Props) {
  const enabled = useSyncExternalStore(subscribeMotion, getMotionEnabled, getServerSnapshot);

  useEffect(() => {
    document.documentElement.classList.toggle("no-motion", !enabled);
  }, [enabled]);

  const value = useMemo(() => ({ enabled, setEnabled: setMotionEnabled }), [enabled]);

  return <MotionContext value={value}>{children}</MotionContext>;
}

export function useMotionSettings(): MotionSettings {
  const settings = use(MotionContext);
  if (!settings) throw new Error("useMotionSettings must be used inside <MotionProvider>.");
  return settings;
}

/** True when animations may run (OS setting and the site's toggle both allow it). */
export function useMotionEnabled(): boolean {
  return useMotionSettings().enabled;
}
