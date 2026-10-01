# MOTION.md — Animation & Motion Spec

> Implementation guide for Claude Code. Read alongside `CLAUDE.md`.
> Goal: editorial, award-site-style motion (smooth scroll, marquees, text reveals, parallax, masked video, page transitions) that stays fast on mid-range Android phones.

---

## 0. Rules

1. **Techniques, not copies.** Never copy layouts, copy, images, video, or code from any reference site. All content is original to [STORE_NAME].
2. **Build one effect per task.**
   - Build it first on `/dev/motion` (section 8).
   - Get the owner's approval.
   - Only then use it on real pages.
3. **Animate only `transform` and `opacity`** (plus `clip-path` for masks). Never animate `width`, `height`, `top`, `left`, `margin`, or `filter: blur` on large elements.
4. **Every effect must respect motion settings**: `prefers-reduced-motion` and the site's own "Pause animations" toggle (section 3).
5. **Content is visible without JavaScript.** Set the starting (hidden) states in JS just before animating, never in CSS. A failed script must not hide text.
6. **Clean up everything.** Use `useGSAP()` from `@gsap/react` with a `scope` so ScrollTriggers and tweens are reverted on unmount and on route change.
7. **Keep shopping pages lean.** No Lenis, no heavy scroll effects on: product listings, search, cart, checkout, account, admin.

---

## 1. Dependencies

```
pnpm add gsap @gsap/react lenis
```

- **GSAP (free, all plugins included):** ScrollTrigger, SplitText, and GSDevTools (dev only).
- **Lenis:** smooth inertia scroll.
- **Embla:** already in the stack, for carousels.
- Do **not** add Locomotive Scroll, Framer Motion page-transition libs, Barba, or Three.js unless the owner asks.

---

## 2. Where motion lives

```
app/
  (brand)/            # FULL motion: home, lookbook, about, sell-with-us, drops landing
    layout.tsx        # wraps children in <SmoothScroll>
  (store)/            # LIGHT motion only: hovers, drawer, fades
components/motion/
  MotionProvider.tsx  # reads reduced-motion + toggle, exposes useMotionEnabled()
  SmoothScroll.tsx
  Marquee.tsx
  HoverMarquee.tsx
  RevealText.tsx
  RevealImage.tsx
  Parallax.tsx
  MaskedVideo.tsx
  StackCards.tsx
  PageTransition.tsx
  MotionToggle.tsx
lib/motion/
  tokens.ts           # durations, eases, staggers (single source of truth)
  gsap.ts             # registers plugins once, client-only
```

---

## 3. Motion settings (build this first)

`MotionProvider` (client component in the root layout):
- `enabled` defaults to `false` when `matchMedia('(prefers-reduced-motion: reduce)')` matches, otherwise `true`.
- The user's choice from `MotionToggle` is saved in localStorage key `motion` (wrap reads/writes in try/catch).
- When disabled:
  - Put class `no-motion` on `<html>`.
  - Call `gsap.globalTimeline.pause()`.
  - Destroy Lenis.
  - Components render their final state immediately.

```css
/* globals.css */
html.no-motion *, html.no-motion *::before, html.no-motion *::after {
  animation: none !important;
  transition-duration: 0.01ms !important;
}
```

`MotionToggle`:
- A small "Pause animations" / "Play animations" button in the header and footer.
- `aria-pressed` reflects the current state.
- Keyboard accessible.

---

## 4. Motion tokens (`lib/motion/tokens.ts`)

Use ONLY these values. To change the feel, change the tokens, not individual components.

```ts
export const ease = {
  out: "expo.out",          // reveals, entrances
  inOut: "power3.inOut",    // page transitions, overlays
  scrub: "none",            // anything tied to scroll position
};
export const dur = { fast: 0.4, base: 0.8, slow: 1.2, page: 0.6 };
export const stagger = { lines: 0.08, items: 0.06 };
export const reveal = { start: "top 85%" }; // ScrollTrigger start for reveals
export const lenis = { lerp: 0.1, wheelMultiplier: 1 };
```

---

## 5. Components

### 5.1 SmoothScroll
- Create Lenis with `tokens.lenis`, and drive it from `gsap.ticker`.
- Call `ScrollTrigger.update` on each Lenis scroll, and set `gsap.ticker.lagSmoothing(0)`.
- On each route change, scroll to the top immediately and call `ScrollTrigger.refresh()` after images load.
- Skip it completely when motion is disabled, or on touch devices if testing shows jank (native touch scroll is already smooth).

```tsx
"use client";
import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { lenis as cfg } from "@/lib/motion/tokens";
import { useMotionEnabled } from "./MotionProvider";

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const enabled = useMotionEnabled();
  useEffect(() => {
    if (!enabled) return;
    const l = new Lenis(cfg);
    l.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => l.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => { gsap.ticker.remove(tick); l.destroy(); };
  }, [enabled]);
  return <>{children}</>;
}
```

### 5.2 Marquee (infinite text/logo strip)
- **Props:** `items: string[]`, `speed` (seconds per loop, default 30), `direction: "left" | "right"`, `separator` (e.g. `·` or a small icon).
- **CSS only:** render the items twice inside one track and animate `translateX(0 → -50%)`.
- The duplicate copy gets `aria-hidden="true"`.
- Pause on hover. Screen readers read the list once.
- **Example content (original):** "Pre-loved denim · Vintage tees · Y2K finds · One of one · Graded & measured · New drops weekly".

```css
.marquee-track { display:flex; width:max-content; animation: marquee var(--speed,30s) linear infinite; }
.marquee[data-dir="right"] .marquee-track { animation-direction: reverse; }
.marquee:hover .marquee-track { animation-play-state: paused; }
@keyframes marquee { to { transform: translateX(-50%); } }
```

### 5.3 HoverMarquee (button/link label that scrolls on hover)
- A link whose visible label is replaced on hover by a fast-scrolling repeated label (`Shop now · Shop now · …`).
- Render about 8 copies; the extra copies are `aria-hidden`. The link's accessible name is the label once.
- The animation runs only on `:hover` / `:focus-visible`, at about 6s per loop.
- On touch devices, show the static label (no hover).

### 5.4 RevealText (line-by-line masked reveal)
- **Props:** `as` (h1/h2/p), `delay`, `trigger: "load" | "scroll"`.
- Use `SplitText.create(el, { type: "lines", mask: "lines", autoSplit: true })`.
- **Animation:** `from` with `yPercent: 100`, duration `dur.slow`, ease `ease.out`, stagger `stagger.lines`.
- With `trigger: "scroll"`, use a ScrollTrigger with `start: reveal.start` and `once: true`.
- Wait for fonts (`document.fonts.ready`) before splitting, so the line breaks are correct.
- Revert the split on unmount.

```tsx
useGSAP(() => {
  if (!enabled) return;
  document.fonts.ready.then(() => {
    const split = SplitText.create(ref.current!, { type: "lines", mask: "lines", autoSplit: true,
      onSplit: (s) => gsap.from(s.lines, {
        yPercent: 100, duration: dur.slow, ease: ease.out, stagger: stagger.lines, delay,
        scrollTrigger: trigger === "scroll" ? { trigger: ref.current, start: reveal.start, once: true } : undefined,
      }),
    });
  });
}, { scope: ref, dependencies: [enabled] });
```

### 5.5 RevealImage (clip reveal + settle)
- A wrapper with `overflow:hidden` around a `next/image`.
- On enter:
  - the wrapper animates `clip-path: inset(100% 0 0 0)` → `inset(0)`;
  - at the same time the image scales from 1.15 → 1;
  - duration `dur.slow`, ease `ease.out`, once.
- The image keeps `sizes` and `alt`; only the first hero image gets `priority`.

### 5.6 Parallax
- **Props:** `amount` (yPercent range, default 10).
- The inner element is about 120% of the frame's height and is tweened from `yPercent: -amount` to `amount` with `scrub: true` and `ease.scrub`.
- Disable on screens under 768px if it causes jank.

### 5.7 MaskedVideo (circle / pill video that grows on scroll)
- A `<video autoplay muted loop playsinline preload="metadata" poster=...>`.
- It sits inside a mask (`border-radius:50%` or `clip-path: circle()`).
- **Scroll behavior:** scale from 0.6 → 1 (scrub) as the section passes through the viewport.
- **Files:** MP4 (H.264) + WebM, under 2MB, 8–12s loop, no audio.
- When motion is disabled, show the poster frame only.
- Pause the video when it's off-screen (IntersectionObserver).

### 5.8 StackCards (sticky cards that stack while scrolling)
- For story or feature sections, e.g. "Why thrift", "How grading works", "Sell with us".
- Each card is `position: sticky` with an increasing `top` offset.
- As the next card arrives, the previous one scales to 0.94 and dims (opacity 0.6), with scrub.
- Max 4 cards. On mobile, use a plain vertical list with fade-ins.

### 5.9 PageTransition
- **Enter animation only**, in `app/(brand)/template.tsx`: a full-screen overlay in `--color-primary` wipes off upwards (`yPercent: 0 → -100`, `dur.page`, `ease.inOut`), then the content fades in.
- The whole transition takes under 700ms. It never blocks clicks for longer than that.
- Optional later: the View Transitions API behind a feature flag. Fall back to the overlay.
- Skip entirely when motion is disabled.

### 5.10 Signature details (cheap, high impact)
- **Bilingual subheads:** a small secondary line in [Hindi/Tamil] under English section titles, set in a lighter weight with letter-spacing.
- **Product card hover (store pages too):** swap to the second image with a 0.4s crossfade, and slide the price/CTA up 8px.
- **Magnetic CTA (desktop only):** the button moves up to 6px toward the cursor, using `gsap.quickTo`.
- **Number counters** ("Items rescued from landfill"): count up once on enter.

---

## 6. Page recipes

**Home (`(brand)/page.tsx`)**
1. Hero: RevealText (load) on the headline + RevealImage hero + HoverMarquee CTAs.
2. Marquee strip of categories/tags.
3. Drop banner: Parallax image + countdown.
4. Featured products: Embla carousel (autoplay with a visible pause button). Cards use the hover swap.
5. Story section: StackCards (Why thrift / Graded & measured / Sell with us).
6. MaskedVideo lookbook teaser.
7. Impact counters + RevealText.
8. Instagram grid with a fade-in stagger.

**Lookbook:** full-bleed RevealImages, alternating Parallax, a RevealText caption for each look.

**About / Sell with us:** RevealText headings, StackCards for the process steps, one MaskedVideo.

**Store pages:** hover swaps, drawer slide, skeleton fades only.

---

## 7. Performance budget

- Lighthouse mobile ≥ 90 on brand pages, ≥ 95 on store pages.
- No layout shift from split text (CLS < 0.05). Reserve space and split only after fonts load.
- Brand pages ship under 120KB of extra JS for motion. Import GSAP plugins only in the client components that use them.
- At most 1 video per viewport, and lazy-load the others.
- Test on a mid-range Android at 4× CPU throttle in DevTools. Aim for 60fps with no long tasks during scroll.

---

## 8. `/dev/motion` playground (build before using effects on pages)

- One section per component from section 5, each with sample content.
- A tuning panel (GSDevTools for timelines, plus simple range inputs) that overrides `dur`, `ease`, `stagger`, and Lenis `lerp` live.
- A "Copy values" button that prints the current tokens as a TS object, so the owner can paste the tuned values back.
- This route is excluded from the production build (`notFound()` when `NODE_ENV === "production"`).

---

## 9. Build order

1. MotionProvider + MotionToggle + tokens + gsap registration.
2. `/dev/motion` page shell.
3. SmoothScroll → Marquee → HoverMarquee → RevealText → RevealImage → Parallax → MaskedVideo → StackCards → PageTransition. **Stop for owner review after each.**
4. Apply the page recipes: Home first, then Lookbook, then About/Sell.
5. Performance and accessibility pass (section 10).

---

## 10. Definition of done (per effect)

- [ ] Works and looks right at 360px, 768px, 1280px
- [ ] Renders its final state with motion disabled (both reduced-motion and the toggle)
- [ ] Content is visible if JS fails
- [ ] No console errors and no leftover ScrollTriggers after navigating away and back
- [ ] Smooth on a throttled mobile profile; no CLS
- [ ] Uses only `tokens.ts` values
- [ ] Short note written: what was built, which files, what the owner should tune
