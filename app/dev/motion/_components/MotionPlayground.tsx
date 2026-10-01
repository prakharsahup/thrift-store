"use client";

import { useState } from "react";
import { MotionTokensProvider } from "@/components/motion/MotionTokensProvider";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { motionTokens, type MotionTokens } from "@/lib/motion/tokens";
import { TuningPanel } from "./TuningPanel";

type Props = { children: React.ReactNode };

// Wraps the playground in live-tunable tokens and smooth scroll. Changing a token re-runs every
// effect on the page with the new value.
export function MotionPlayground({ children }: Props) {
  const [tokens, setTokens] = useState<MotionTokens>(motionTokens);

  return (
    <MotionTokensProvider value={tokens}>
      <SmoothScroll>{children}</SmoothScroll>
      <TuningPanel tokens={tokens} onChange={setTokens} />
    </MotionTokensProvider>
  );
}
