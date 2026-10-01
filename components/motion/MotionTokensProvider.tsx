"use client";

import { createContext, use } from "react";
import { motionTokens, type MotionTokens } from "@/lib/motion/tokens";

// Real pages never render this provider, so they get tokens.ts as-is. Only the /dev/motion tuning
// panel wraps its demos in it to try new values live.
const MotionTokensContext = createContext<MotionTokens>(motionTokens);

type Props = { value: MotionTokens; children: React.ReactNode };

export function MotionTokensProvider({ value, children }: Props) {
  return <MotionTokensContext value={value}>{children}</MotionTokensContext>;
}

export function useMotionTokens(): MotionTokens {
  return use(MotionTokensContext);
}
