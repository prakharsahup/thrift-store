import "client-only";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { getMotionEnabled, subscribeMotion } from "./preference";

// Registers the plugins most effects share, once. Heavier plugins (SplitText) are registered
// inside the component that uses them, so pages without that effect don't ship them (MOTION.md §7).
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);

  // Pause every GSAP animation while motion is disabled. Living here (not in MotionProvider)
  // means GSAP is only downloaded on pages that actually animate.
  const sync = () => {
    if (getMotionEnabled()) gsap.globalTimeline.resume();
    else gsap.globalTimeline.pause();
  };
  sync();
  subscribeMotion(sync);
}

export { gsap, ScrollTrigger, useGSAP };
