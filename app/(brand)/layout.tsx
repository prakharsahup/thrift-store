import { SiteShell } from "@/components/layout/SiteShell";

// Brand pages (home, about, lookbook). Drop Night redesign: native scrolling and no page-enter
// transition here either, so the home page loads no animation library at all. About and
// Lookbook keep their own on-scroll reveals (MOTION.md), which respect the motion toggle.
export default function BrandLayout({ children }: LayoutProps<"/">) {
  return <SiteShell>{children}</SiteShell>;
}
