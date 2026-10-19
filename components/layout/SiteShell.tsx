import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartSync } from "@/components/cart/CartSync";
import { getTopBrands } from "@/lib/server/catalogue";
import { AnnouncementBar } from "./AnnouncementBar";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { MobileMenu } from "./MobileMenu";
import { MobileMenuProvider } from "./MobileMenuProvider";
import { MobileNav } from "./MobileNav";

type Props = { children: React.ReactNode };

// The storefront chrome, shared by the (brand) and (store) route groups and the 404 page. The
// Brand menu's list comes from the database (cached per request, cookie-free, so pages stay
// cacheable).
export async function SiteShell({ children }: Props) {
  const brands = await getTopBrands();

  return (
    <MobileMenuProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-fg focus:px-4 focus:py-2 focus:text-sm focus:text-bg"
      >
        Skip to content
      </a>
      {/* display: contents keeps the sticky header working; print:hidden leaves printed pages
          (receipts, policies) without the site chrome. */}
      <div className="contents print:hidden">
        <AnnouncementBar />
        <Header brands={brands} />
      </div>
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <div className="contents print:hidden">
        <Footer />
        <MobileNav />
      </div>
      <MobileMenu brands={brands} />
      <CartDrawer />
      <CartSync />
    </MobileMenuProvider>
  );
}
