import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { site } from "@/lib/config/site";
import { requireAdmin } from "@/lib/server/auth";

export const metadata: Metadata = {
  title: { default: "Admin", template: `%s · Admin · ${site.name}` },
  robots: { index: false, follow: false },
};

// Admin area (CLAUDE.md §8). Gated three times: proxy.ts (session + role), this layout
// (requireAdmin), and RLS on every table (is_admin()). Plain and fast: no storefront chrome,
// no motion.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { user } = await requireAdmin();
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-border bg-bg">
        <div className="site-container flex h-14 items-center justify-between gap-4">
          <p className="font-display text-lg font-bold">
            {site.name} <span className="font-body text-sm font-semibold text-muted">admin</span>
          </p>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-muted sm:inline">{user.email ?? user.phone}</span>
            <Link href="/" className="font-semibold text-primary underline underline-offset-4">
              View shop
            </Link>
          </div>
        </div>
      </header>
      <div className="site-container grid grid-cols-[minmax(0,1fr)] gap-6 py-4 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10 lg:py-8">
        <div className="lg:sticky lg:top-22 lg:self-start">
          <AdminNav />
        </div>
        <main id="main" className="min-w-0 pb-16">
          {children}
        </main>
      </div>
    </div>
  );
}
