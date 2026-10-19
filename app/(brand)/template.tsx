import { PageTransition } from "@/components/motion/PageTransition";

// A template remounts on every navigation between brand pages, which plays the enter transition.
export default function BrandTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
