import Link from "next/link";
import { notFound } from "next/navigation";
import { MotionToggle } from "@/components/motion/MotionToggle";

// Developer-only pages: excluded from production builds (MOTION.md §8).
export default function DevLayout({ children }: LayoutProps<"/dev">) {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-border bg-bg">
        <div className="site-container flex h-14 items-center justify-between gap-4">
          <nav aria-label="Developer pages" className="flex gap-4 text-sm font-medium">
            <Link href="/" className="hover:text-primary">
              Home
            </Link>
            <Link href="/dev/tokens" className="hover:text-primary">
              Tokens
            </Link>
            <Link href="/dev/motion" className="hover:text-primary">
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
