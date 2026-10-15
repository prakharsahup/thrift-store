"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { cn } from "@/lib/utils/cn";

type Props = {
  images: { url: string; alt: string }[];
  title: string;
  /** The photo on show; the gallery keeps its carousel in step with it. */
  index: number;
  onIndexChange: (index: number) => void;
  open: boolean;
  onClose: () => void;
};

type Point = { x: number; y: number };
type View = { scale: number; x: number; y: number };

const MIN_SCALE = 1;
const MAX_SCALE = 4;
/** Tap / click / double-tap target. */
const TAP_SCALE = 2;
/** Movement (px) under which a press still counts as a tap. */
const TAP_SLOP = 8;
const TAP_MAX_MS = 300;
/** Horizontal drag (px) at 1× that flips to the next or previous photo. */
const SWIPE_MIN = 60;
const RESET: View = { scale: 1, x: 0, y: 0 };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const midpoint = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

// Full-screen zoom for PDP photos (CLAUDE.md §8). Built on pointer events, so mouse, touch and pen
// share one code path:
// - tap / click toggles 2× at that spot; drag pans while zoomed; pinch zooms 1–4× around the fingers;
// - at 1×, a horizontal swipe changes photo;
// - keyboard: + / − zoom, 0 resets, arrows pan (zoomed) or change photo (not zoomed), Esc closes.
// The native <dialog> (showModal) traps focus, closes on Esc and returns focus to the opener.
// Only `transform` is animated (MOTION.md §0 rule 3).
export function ZoomViewer({ images, title, index, onIndexChange, open, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>(RESET);
  // Mirrors `view` for pointer handlers, which run many times between renders.
  const viewRef = useRef<View>(RESET);
  const [gesturing, setGesturing] = useState(false);
  const natural = useRef<{ w: number; h: number } | null>(null);
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<{
    startView: View;
    startMid: Point;
    startDist: number;
    startTime: number;
    tap: boolean;
  } | null>(null);

  const count = images.length;
  const image = images[index] ?? images[0];
  const zoomed = view.scale > 1;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function apply(next: View) {
    const clamped = clampView(next);
    viewRef.current = clamped;
    setView(clamped);
  }

  // Keep the photo covering the screen: never pan past its edges, centre it when it's smaller.
  function clampView(next: View): View {
    const stage = stageRef.current;
    const scale = clamp(next.scale, MIN_SCALE, MAX_SCALE);
    if (!stage) return { ...next, scale };
    const { width, height } = stage.getBoundingClientRect();
    const size = natural.current ?? { w: 3, h: 4 };
    const fit = Math.min(width / size.w, height / size.h);
    const maxX = Math.max(0, (size.w * fit * scale - width) / 2);
    const maxY = Math.max(0, (size.h * fit * scale - height) / 2);
    return { scale, x: clamp(next.x, -maxX, maxX), y: clamp(next.y, -maxY, maxY) };
  }

  /** Zoom to `scale`, keeping the photo point under `focus` (relative to the centre) in place. */
  function zoomTo(scale: number, focus: Point = { x: 0, y: 0 }) {
    const current = viewRef.current;
    const nextScale = clamp(scale, MIN_SCALE, MAX_SCALE);
    const ratio = nextScale / current.scale;
    apply({
      scale: nextScale,
      x: focus.x - (focus.x - current.x) * ratio,
      y: focus.y - (focus.y - current.y) * ratio,
    });
  }

  function goTo(next: number) {
    if (count < 2) return;
    viewRef.current = RESET;
    setView(RESET);
    natural.current = null;
    onIndexChange((next + count) % count);
  }

  /** Pointer position relative to the centre of the stage. */
  function toStage(event: React.PointerEvent): Point {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - (rect.left + rect.width / 2),
      y: event.clientY - (rect.top + rect.height / 2),
    };
  }

  /** (Re)starts a gesture from the pointers currently down. */
  function beginGesture(tap: boolean) {
    const points = [...pointers.current.values()];
    const [a, b] = points;
    if (!a) {
      gesture.current = null;
      return;
    }
    gesture.current = {
      startView: viewRef.current,
      startMid: b ? midpoint(a, b) : a,
      startDist: b ? distance(a, b) : 0,
      startTime: performance.now(),
      tap,
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, toStage(event));
    setGesturing(true);
    // A second finger turns a tap into a pinch.
    beginGesture(pointers.current.size === 1);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, toStage(event));
    const g = gesture.current;
    if (!g) return;
    const [a, b] = [...pointers.current.values()];

    if (a && b && g.startDist > 0) {
      // Pinch: scale by the change in finger distance, around the point between the fingers.
      const mid = midpoint(a, b);
      const scale = clamp((g.startView.scale * distance(a, b)) / g.startDist, MIN_SCALE, MAX_SCALE);
      const anchor = {
        x: (g.startMid.x - g.startView.x) / g.startView.scale,
        y: (g.startMid.y - g.startView.y) / g.startView.scale,
      };
      apply({ scale, x: mid.x - anchor.x * scale, y: mid.y - anchor.y * scale });
      return;
    }

    if (a) {
      const dx = a.x - g.startMid.x;
      const dy = a.y - g.startMid.y;
      if (Math.hypot(dx, dy) > TAP_SLOP) g.tap = false;
      if (g.startView.scale > 1) {
        apply({ ...g.startView, x: g.startView.x + dx, y: g.startView.y + dy });
      }
    }
  }

  function handlePointerEnd(event: React.PointerEvent<HTMLDivElement>, cancelled: boolean) {
    if (!pointers.current.has(event.pointerId)) return;
    const point = toStage(event);
    pointers.current.delete(event.pointerId);
    const g = gesture.current;

    if (pointers.current.size > 0) {
      // One finger lifted from a pinch: carry on panning with the other.
      beginGesture(false);
      return;
    }
    setGesturing(false);
    gesture.current = null;
    if (!g || cancelled) return;

    const dx = point.x - g.startMid.x;
    const dy = point.y - g.startMid.y;
    if (g.tap && performance.now() - g.startTime < TAP_MAX_MS) {
      if (viewRef.current.scale > 1) apply(RESET);
      else zoomTo(TAP_SCALE, point);
    } else if (
      g.startView.scale === 1 &&
      viewRef.current.scale === 1 &&
      Math.abs(dx) > SWIPE_MIN &&
      Math.abs(dx) > Math.abs(dy)
    ) {
      goTo(index + (dx < 0 ? 1 : -1));
    } else if (viewRef.current.scale < 1.05) {
      apply(RESET);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDialogElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const stage = stageRef.current?.getBoundingClientRect();
    const panX = (stage?.width ?? 400) * 0.15;
    const panY = (stage?.height ?? 400) * 0.15;
    const current = viewRef.current;
    const pan = (x: number, y: number) => apply({ ...current, x: current.x + x, y: current.y + y });

    switch (event.key) {
      case "+":
      case "=":
        zoomTo(current.scale + 1);
        break;
      case "-":
      case "_":
        zoomTo(current.scale - 1);
        break;
      case "0":
        apply(RESET);
        break;
      case "ArrowLeft":
        if (current.scale > 1) pan(panX, 0);
        else goTo(index - 1);
        break;
      case "ArrowRight":
        if (current.scale > 1) pan(-panX, 0);
        else goTo(index + 1);
        break;
      case "ArrowUp":
        if (current.scale > 1) pan(0, panY);
        else return;
        break;
      case "ArrowDown":
        if (current.scale > 1) pan(0, -panY);
        else return;
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  function handleClose() {
    pointers.current.clear();
    gesture.current = null;
    viewRef.current = RESET;
    setView(RESET);
    setGesturing(false);
    onClose();
  }

  if (!image) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-label={`Zoomed photos of ${title}`}
      onClose={handleClose}
      onKeyDown={handleKeyDown}
      className="surface-dark m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden bg-bg p-0 text-fg backdrop:bg-overlay"
    >
      {open ? (
        <div className="relative h-full">
          <div
            ref={stageRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={(event) => handlePointerEnd(event, false)}
            onPointerCancel={(event) => handlePointerEnd(event, true)}
            className={cn(
              "absolute inset-0 touch-none overflow-hidden select-none",
              zoomed ? (gesturing ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in",
            )}
          >
            <div
              className={cn(
                "absolute inset-0 will-change-transform",
                !gesturing && "transition-transform duration-200 ease-out",
              )}
              style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
            >
              <ImageWithFallback
                key={image.url}
                src={image.url}
                alt={image.alt || title}
                fill
                // Twice the screen width on phones, so 2× zoom stays sharp.
                sizes="(min-width: 1024px) 100vw, 200vw"
                // The visitor asked for this photo: fetch it now rather than lazily.
                loading="eager"
                draggable={false}
                onLoad={(event) => {
                  const img = event.currentTarget;
                  natural.current = { w: img.naturalWidth, h: img.naturalHeight };
                }}
                className="pointer-events-none object-contain"
              />
            </div>
          </div>

          <p className="sr-only" aria-live="polite">
            Photo {index + 1} of {count}
            {zoomed ? ", zoomed in" : ""}
          </p>

          <Button
            variant="overlay"
            size="icon"
            shape="round"
            onClick={() => dialogRef.current?.close()}
            autoFocus
            className="absolute top-4 right-4"
          >
            <X aria-hidden />
            <span className="sr-only">Close zoom</span>
          </Button>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 px-4 pt-8 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <p className="rounded-full bg-bg/70 px-3 py-1 text-center text-xs text-fg">
              Tap to zoom · drag to move · pinch, or use + and − keys
            </p>
            <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-bg/70 p-1">
              {count > 1 ? (
                <Button variant="overlay" size="icon" shape="round" onClick={() => goTo(index - 1)}>
                  <ChevronLeft aria-hidden />
                  <span className="sr-only">Previous photo</span>
                </Button>
              ) : null}
              <Button
                variant="overlay"
                size="icon"
                shape="round"
                disabled={view.scale <= MIN_SCALE}
                onClick={() => zoomTo(view.scale - 1)}
              >
                <Minus aria-hidden />
                <span className="sr-only">Zoom out</span>
              </Button>
              <span aria-hidden className="w-12 text-center text-xs font-semibold tabular-nums">
                {Math.round(view.scale * 100)}%
              </span>
              <Button
                variant="overlay"
                size="icon"
                shape="round"
                disabled={view.scale >= MAX_SCALE}
                onClick={() => zoomTo(view.scale + 1)}
              >
                <Plus aria-hidden />
                <span className="sr-only">Zoom in</span>
              </Button>
              {count > 1 ? (
                <Button variant="overlay" size="icon" shape="round" onClick={() => goTo(index + 1)}>
                  <ChevronRight aria-hidden />
                  <span className="sr-only">Next photo</span>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
