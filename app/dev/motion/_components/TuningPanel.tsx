"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { GSDevTools } from "gsap/GSDevTools";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { inputVariants } from "@/components/ui/Input";
import { gsap } from "@/lib/motion/gsap";
import { motionTokens, type MotionTokens } from "@/lib/motion/tokens";
import { TokenSlider } from "./TokenSlider";

type Props = {
  tokens: MotionTokens;
  onChange: (tokens: MotionTokens) => void;
};

const outEases = [
  "expo.out",
  "power4.out",
  "power3.out",
  "power2.out",
  "circ.out",
  "sine.out",
  "back.out(1.4)",
];
const inOutEases = [
  "power3.inOut",
  "power2.inOut",
  "power4.inOut",
  "expo.inOut",
  "circ.inOut",
  "sine.inOut",
];

function formatObject(object: Record<string, string | number>): string {
  const entries = Object.entries(object).map(([key, value]) => `${key}: ${JSON.stringify(value)}`);
  return `{ ${entries.join(", ")} }`;
}

/** The tokens as TypeScript, ready to paste into lib/motion/tokens.ts. */
function toSource(tokens: MotionTokens): string {
  return (["ease", "dur", "stagger", "reveal", "lenis"] as const)
    .map((group) => `export const ${group} = ${formatObject(tokens[group])};`)
    .join("\n");
}

// Floating panel on /dev/motion: overrides motion tokens live for every demo on the page, and
// copies the tuned values back out as code (MOTION.md §8).
export function TuningPanel({ tokens, onChange }: Props) {
  const [copyStatus, setCopyStatus] = useState("");
  const [devToolsOn, setDevToolsOn] = useState(false);
  const devTools = useRef<GSDevTools | null>(null);
  const outId = useId();
  const inOutId = useId();
  const source = toSource(tokens);

  useEffect(() => () => devTools.current?.kill(), []);

  function set<G extends "dur" | "stagger" | "lenis">(
    group: G,
    key: keyof MotionTokens[G],
    value: number,
  ) {
    onChange({ ...tokens, [group]: { ...tokens[group], [key]: value } });
  }

  function setEase(key: "out" | "inOut", value: string) {
    onChange({ ...tokens, ease: { ...tokens.ease, [key]: value } });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(source);
      setCopyStatus("Copied — paste into lib/motion/tokens.ts.");
    } catch {
      setCopyStatus("Couldn't reach the clipboard — select the code below instead.");
    }
  }

  // GSDevTools is loaded on demand, so it never ships outside this dev page.
  async function toggleDevTools() {
    if (devTools.current) {
      devTools.current.kill();
      devTools.current = null;
      setDevToolsOn(false);
      return;
    }
    const { GSDevTools: Tools } = await import("gsap/GSDevTools");
    gsap.registerPlugin(Tools);
    devTools.current = Tools.create({ css: { zIndex: 60 } });
    setDevToolsOn(true);
  }

  return (
    <details
      data-lenis-prevent
      className="group fixed right-4 bottom-4 z-40 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-border bg-bg text-fg"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        <SlidersHorizontal aria-hidden className="size-4" />
        Tune motion
        <span className="ml-auto text-xs font-normal text-muted group-open:hidden">open</span>
      </summary>

      <div className="max-h-[70vh] space-y-5 overflow-y-auto border-t border-border px-4 py-4">
        <fieldset className="space-y-2">
          <legend className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">
            Durations (s)
          </legend>
          {(["fast", "base", "slow", "page"] as const).map((key) => (
            <TokenSlider
              key={key}
              label={`dur.${key}`}
              value={tokens.dur[key]}
              min={0.1}
              max={key === "page" ? 1 : 3}
              step={0.05}
              onChange={(value) => set("dur", key, value)}
            />
          ))}
          <p className="text-xs text-muted">Keep dur.page under 0.7 (MOTION.md §5.9).</p>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">
            Staggers (s)
          </legend>
          {(["lines", "items"] as const).map((key) => (
            <TokenSlider
              key={key}
              label={`stagger.${key}`}
              value={tokens.stagger[key]}
              min={0}
              max={0.3}
              step={0.01}
              onChange={(value) => set("stagger", key, value)}
            />
          ))}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">
            Eases
          </legend>
          <div className="grid grid-cols-[6rem_1fr] items-center gap-2 text-xs">
            <label htmlFor={outId} className="font-mono">
              ease.out
            </label>
            <select
              id={outId}
              value={tokens.ease.out}
              onChange={(event) => setEase("out", event.target.value)}
              className={inputVariants({ className: "h-9 px-2 text-xs" })}
            >
              {outEases.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
            <label htmlFor={inOutId} className="font-mono">
              ease.inOut
            </label>
            <select
              id={inOutId}
              value={tokens.ease.inOut}
              onChange={(event) => setEase("inOut", event.target.value)}
              className={inputVariants({ className: "h-9 px-2 text-xs" })}
            >
              {inOutEases.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">
            Smooth scroll
          </legend>
          <TokenSlider
            label="lenis.lerp"
            value={tokens.lenis.lerp}
            min={0.02}
            max={0.3}
            step={0.01}
            onChange={(value) => set("lenis", "lerp", value)}
          />
          <TokenSlider
            label="wheel ×"
            value={tokens.lenis.wheelMultiplier}
            min={0.5}
            max={2}
            step={0.1}
            onChange={(value) => set("lenis", "wheelMultiplier", value)}
          />
          <p className="text-xs text-muted">Lower lerp = floatier scroll.</p>
        </fieldset>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={copy}>
            Copy values
          </Button>
          <Button variant="outline" size="sm" onClick={() => onChange(motionTokens)}>
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            aria-pressed={devToolsOn}
            onClick={toggleDevTools}
            className="aria-pressed:bg-fg aria-pressed:text-bg"
          >
            GSDevTools
          </Button>
        </div>
        <p role="status" className="min-h-4 text-xs text-muted">
          {copyStatus}
        </p>
        <pre className="overflow-x-auto rounded-md bg-surface p-3 font-mono text-xs select-all">
          {source}
        </pre>
      </div>
    </details>
  );
}
