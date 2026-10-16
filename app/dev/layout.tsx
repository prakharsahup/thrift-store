import Link from "next/link";
import { notFound } from "next/navigation";
import { MotionToggle } from "@/components/motion/MotionToggle";

// Developer-only pages: excluded from production builds (MOTION.md §8).
export default function DevLayout({ children }: LayoutProps<"/dev">) {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-border bg-bg">
        <div className="site-container flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2">
          <nav aria-label="Developer pages" className="flex gap-4 text-sm font-medium">
            <Link href="/" className="hover:text-accent">
              Home
            </Link>
            <Link href="/dev/tokens" className="hover:text-accent">
              Tokens
            </Link>
            <Link href="/dev/motion" className="hover:text-accent">
              Motion
            </Link>
          </nav>
          <MotionToggle />
        </div>
      </header>
      {children}
    </div>
  );
}
