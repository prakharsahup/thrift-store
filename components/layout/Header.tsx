import Link from "next/link";
import { Search } from "lucide-react";
import { CartButton } from "@/components/cart/CartButton";
import type { BrandLink, GenderMenu } from "@/lib/server/catalogue";
import { AccountLink } from "./AccountLink";
import { BrandPanel } from "./BrandPanel";
import { GenderPanel } from "./GenderPanel";
import { HeaderSearch } from "./HeaderSearch";
import { IconLink } from "./IconLink";
import { Logo } from "./Logo";
import { MobileMenuButton } from "./MobileMenuButton";
import { NavDropdown } from "./NavDropdown";

type Props = {
  genders: GenderMenu[];
  brands: BrandLink[];
};

const textLink =
  "text-xs font-bold tracking-widest whitespace-nowrap text-accent uppercase hover:text-fg aria-[current=page]:text-fg";

// Sticky header (Drop Night design): lavender wordmark, then plain uppercase text tabs. Below lg:
// menu button, wordmark, search and cart; the bottom nav covers the rest. From lg: Men, Women,
// Unisex and Brand open full-width panels, then Drop and Archive; on the right search, Wishlist,
// Log in / Account and Cart (n).
export function Header({ genders, brands }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg">
      <div className="site-container flex h-14 items-center gap-2 lg:h-16 lg:gap-4">
        <MobileMenuButton className="-ml-2 lg:hidden" />
        <Logo className="lg:mr-2" />

        <nav aria-label="Main" className="hidden h-full items-center lg:flex">
          {genders.map((gender) => (
            <NavDropdown
              key={gender.slug}
              id={`nav-${gender.slug}`}
              label={gender.name}
              activePaths={[`/${gender.slug}`, `/c/${gender.slug}-`]}
            >
              <GenderPanel menu={gender} />
            </NavDropdown>
          ))}
          <NavDropdown id="nav-brand" label="Brand">
            <BrandPanel brands={brands} />
          </NavDropdown>
          <Link href="/drops" className={`${textLink} px-2 xl:px-3`}>
            Drop
          </Link>
          <Link href="/archive" className={`${textLink} px-2 xl:px-3`}>
            Archive
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:gap-4 xl:gap-5">
          <HeaderSearch className="hidden w-56 xl:block 2xl:w-72" />
          <IconLink href="/search" label="Search" className="text-accent xl:hidden">
            <Search aria-hidden />
          </IconLink>
          <Link href="/wishlist" className={`${textLink} hidden lg:inline`}>
            Wishlist
          </Link>
          <AccountLink className={`${textLink} hidden lg:inline`} />
          <CartButton variant="text" className={`${textLink} -mr-1 px-1 py-2`} />
        </div>
      </div>
    </header>
  );
}
