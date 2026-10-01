import { PageTransition } from "@/components/motion/PageTransition";

// Demo of the brand-page transition. A template remounts on every navigation, which replays it.
export default function TransitionTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
