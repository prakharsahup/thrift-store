// Inlined in <head> so `no-motion` is on <html> before first paint (no flash of CSS motion).
// Mirrors getMotionEnabled() in preference.ts — keep the two in sync.
//
// When motion is on it also adds `reveal-pending`, which hides above-the-fold reveals
// ([data-reveal="load"]) until their component has set the animation's start state. This can't hide
// content for good: it only exists when JS runs, and it is removed after 2.5s whatever happens.
export const motionInitScript = `(function(){
  var html = document.documentElement;
  var stored = null;
  try { stored = localStorage.getItem("motion"); } catch (e) {}
  var enabled = stored === "on" ? true : stored === "off" ? false
    : !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!enabled) { html.classList.add("no-motion"); return; }
  html.classList.add("reveal-pending");
  setTimeout(function(){ html.classList.remove("reveal-pending"); }, 2500);
})();`;
