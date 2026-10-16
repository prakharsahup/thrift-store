import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartSync } from "@/components/cart/CartSync";
import { featuredCategorySlugs } from "@/lib/config/home";
import { getFeaturedDrop, getGenderMenus, getShopMenu, getTopBrands } from "@/lib/server/catalogue";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { MobileMenu } from "./MobileMenu";
import { MobileMenuProvider } from "./MobileMenuProvider";
import { MobileNav } from "./MobileNav";

type Props = { children: React.ReactNode };

// The storefront chrome, shared by the (brand) and (store) route groups and the 404 page. The
// gender menus, brands, footer categories and current drop come from the database; every read is
// cached per request and uses the cookie-free client, so pages stay cacheable.
export async function SiteShell({ children }: Props) {
  const [menu, genders, brands, drop] = await Promise.all([
    getShopMenu(featuredCategorySlugs),
    getGenderMenus(featuredCategorySlugs),
    getTopBrands(),
    getFeaturedDrop(),
  ]);

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
        <Header genders={genders} brands={brands} />
      </div>
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <div className="contents print:hidden">
        <Footer menu={menu} drop={drop} />
        <MobileNav />
      </div>
      <MobileMenu genders={genders} brands={brands} />
      <CartDrawer />
      <CartSync />
    </MobileMenuProvider>
  );
}
