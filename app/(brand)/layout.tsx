import { SiteShell } from "@/components/layout/SiteShell";
import { SmoothScroll } from "@/components/motion/SmoothScroll";

// Full-motion brand pages (MOTION.md §2): Lenis smooth scroll here, the page transition in
// template.tsx. Shopping pages live in (store) and get neither.
export default function BrandLayout({ children }: LayoutProps<"/">) {
  return (
    <SiteShell>
      <SmoothScroll>{children}</SmoothScroll>
    </SiteShell>
  );
}
