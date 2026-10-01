// Single source of truth for motion. To change the feel, change these values — never per component.
export const ease = {
  out: "expo.out", // reveals, entrances
  inOut: "power3.inOut", // page transitions, overlays
  scrub: "none", // anything tied to scroll position
};
export const dur = { fast: 0.4, base: 0.8, slow: 1.2, page: 0.6 };
export const stagger = { lines: 0.08, items: 0.06 };
export const reveal = { start: "top 85%" }; // ScrollTrigger start for reveals
export const lenis = { lerp: 0.1, wheelMultiplier: 1 };

export type MotionTokens = {
  ease: typeof ease;
  dur: typeof dur;
  stagger: typeof stagger;
  reveal: typeof reveal;
  lenis: typeof lenis;
};

/** All tokens together. Components read them through useMotionTokens() so /dev/motion can tune them live. */
export const motionTokens: MotionTokens = { ease, dur, stagger, reveal, lenis };
