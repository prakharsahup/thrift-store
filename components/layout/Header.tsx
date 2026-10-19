import { Heart, Search, User } from "lucide-react";
import { CartButton } from "@/components/cart/CartButton";
import { brandLinks, genderNav } from "@/lib/config/navigation";
import type { BrandLink } from "@/lib/server/catalogue";
import { IconLink } from "./IconLink";
import { Logo } from "./Logo";
import { MegaMenu } from "./MegaMenu";
import { MobileMenuButton } from "./MobileMenuButton";
import { HeaderSearch } from "./HeaderSearch";

// Sticky site header. Below lg: hamburger + logo + search + cart (the bottom nav covers the rest).
// From lg: gender tabs with the mega-menu and all account icons; the search box itself from xl.
// The "Pause animations" toggle lives in the footer only, where it has a visible label.
type Props = { brands: BrandLink[] };

export function Header({ brands }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg">
      <div className="site-container flex h-14 items-center gap-2 lg:h-16 lg:gap-6">
        <MobileMenuButton className="-ml-2 lg:hidden" />
        <Logo />
        <div className="hidden h-full lg:block">
          <MegaMenu items={genderNav} brands={brands} links={brandLinks} />
        </div>

        <div className="ml-auto flex items-center gap-1">
          <HeaderSearch className="mr-2 hidden w-64 xl:block 2xl:w-80" />
          <IconLink href="/search" label="Search" className="xl:hidden">
            <Search aria-hidden />
          </IconLink>
          <IconLink href="/wishlist" label="Wishlist" className="hidden lg:inline-flex">
            <Heart aria-hidden />
          </IconLink>
          {/* Cart before Account. Below lg the account icon is hidden, so the cart is the last
              icon there and takes the edge offset; from lg the account icon does. */}
          <CartButton className="-mr-2 lg:mr-0" />
          <IconLink href="/account" label="Account" className="hidden lg:-mr-2 lg:inline-flex">
            <User aria-hidden />
          </IconLink>
        </div>
      </div>
    </header>
  );
}
