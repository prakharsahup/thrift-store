import "client-only";

// The user's motion choice. Stored as "on" | "off"; when unset we follow prefers-reduced-motion.
export const MOTION_STORAGE_KEY = "motion";
const CHANGE_EVENT = "motionpreferencechange";
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function readStored(): "on" | "off" | null {
  try {
    const value = window.localStorage.getItem(MOTION_STORAGE_KEY);
    return value === "on" || value === "off" ? value : null;
  } catch {
    return null; // private mode / blocked storage
  }
}

export function getMotionEnabled(): boolean {
  const stored = readStored();
  if (stored) return stored === "on";
  return !window.matchMedia(REDUCED_QUERY).matches;
}

export function setMotionEnabled(enabled: boolean): void {
  try {
    window.localStorage.setItem(MOTION_STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    // Storage unavailable: the choice still applies for this page view.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Subscribe to changes from the toggle, the OS setting, or another tab. */
export function subscribeMotion(onChange: () => void): () => void {
  const query = window.matchMedia(REDUCED_QUERY);
  query.addEventListener("change", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    query.removeEventListener("change", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
