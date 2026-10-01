import { SiteShell } from "@/components/layout/SiteShell";

// Shopping pages (MOTION.md §0 rule 7): no smooth scroll and no page transitions here — only light
// motion such as card hovers and drawers.
export default function StoreLayout({ children }: LayoutProps<"/">) {
  return <SiteShell>{children}</SiteShell>;
}
