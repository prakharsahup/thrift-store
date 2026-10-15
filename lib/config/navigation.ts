import { formatMoney } from "@/lib/utils/money";

// Header mega-menu, mobile menu and footer links. Category slugs follow `{gender}-{name}` and must
// match the categories seeded in Phase 3; style and price links are PLP filters in the URL.

export const genders = ["men", "women", "unisex"] as const;
export type Gender = (typeof genders)[number];

export type NavLink = { label: string; href: string };
export type NavColumn = { title: string; links: NavLink[] };
export type NavFeature = { eyebrow: string; title: string; href: string; image: string };
export type GenderNav = {
  gender: Gender;
  label: string;
  href: string;
  columns: NavColumn[];
  feature: NavFeature;
};

/** Style filters: [label, tag]. Tags match products.style_tags. */
export const styleTags = [
  ["Y2K", "y2k"],
  ["Vintage", "vintage"],
  ["Streetwear", "streetwear"],
  ["Workwear", "workwear"],
  ["Sporty", "sporty"],
  ["Minimal", "minimal"],
] as const;

const priceCapsDollars = [499, 999, 1499] as const;

function categories(gender: Gender, items: ReadonlyArray<readonly [string, string]>): NavLink[] {
  return items.map(([label, slug]) => ({ label, href: `/c/${gender}-${slug}` }));
}

function byStyle(gender: Gender): NavColumn {
  return {
    title: "Shop by style",
    links: styleTags.map(([label, tag]) => ({ label, href: `/c/${gender}?style=${tag}` })),
  };
}

function byPrice(gender: Gender): NavColumn {
  return {
    title: "Shop by price",
    links: priceCapsDollars.map((max) => ({
      label: `Under ${formatMoney(max * 100)}`,
      href: `/c/${gender}?max=${max}`,
    })),
  };
}

function feature(gender: Gender, title: string): NavFeature {
  return {
    eyebrow: "Just in",
    title,
    href: `/c/${gender}?sort=newest`,
    image: `https://placehold.co/480x640/F1EBE0/B93A0E/png?text=${encodeURIComponent(title)}`,
  };
}

export const genderNav: readonly GenderNav[] = [
  {
    gender: "men",
    label: "Men",
    href: "/men",
    columns: [
      {
        title: "Topwear",
        links: categories("men", [
          ["T-shirts", "t-shirts"],
          ["Shirts", "shirts"],
          ["Polos", "polos"],
          ["Sweatshirts & hoodies", "sweatshirts"],
          ["Jerseys", "jerseys"],
        ]),
      },
      {
        title: "Bottomwear",
        links: categories("men", [
          ["Jeans", "jeans"],
          ["Trousers", "trousers"],
          ["Cargos", "cargos"],
          ["Shorts", "shorts"],
        ]),
      },
      {
        title: "Layers & extras",
        links: categories("men", [
          ["Jackets", "jackets"],
          ["Knitwear", "knitwear"],
          ["Caps & hats", "caps"],
          ["Bags", "bags"],
        ]),
      },
      byStyle("men"),
      byPrice("men"),
    ],
    feature: feature("men", "Broken-in denim"),
  },
  {
    gender: "women",
    label: "Women",
    href: "/women",
    columns: [
      {
        title: "Topwear",
        links: categories("women", [
          ["Tops", "tops"],
          ["T-shirts", "t-shirts"],
          ["Shirts", "shirts"],
          ["Sweatshirts & hoodies", "sweatshirts"],
          ["Knitwear", "knitwear"],
        ]),
      },
      {
        title: "Dresses & bottoms",
        links: categories("women", [
          ["Dresses", "dresses"],
          ["Co-ord sets", "co-ords"],
          ["Skirts", "skirts"],
          ["Jeans", "jeans"],
          ["Trousers", "trousers"],
          ["Shorts", "shorts"],
        ]),
      },
      {
        title: "Layers & extras",
        links: categories("women", [
          ["Jackets", "jackets"],
          ["Cardigans", "cardigans"],
          ["Bags", "bags"],
          ["Accessories", "accessories"],
        ]),
      },
      byStyle("women"),
      byPrice("women"),
    ],
    feature: feature("women", "Y2K finds"),
  },
  {
    gender: "unisex",
    label: "Unisex",
    href: "/unisex",
    columns: [
      {
        title: "Clothing",
        links: categories("unisex", [
          ["Oversized tees", "oversized-tees"],
          ["Hoodies & sweatshirts", "hoodies"],
          ["Jackets", "jackets"],
          ["Track pants", "track-pants"],
          ["Jerseys", "jerseys"],
        ]),
      },
      {
        title: "Accessories",
        links: categories("unisex", [
          ["Caps & hats", "caps"],
          ["Bags", "bags"],
          ["Scarves", "scarves"],
        ]),
      },
      byStyle("unisex"),
      byPrice("unisex"),
    ],
    feature: feature("unisex", "Vintage sportswear"),
  },
];

/** Which gender section a path belongs to: `/men`, `/c/men-jeans` and `/c/men?style=y2k` → "men". */
export function genderFromPath(pathname: string): Gender | null {
  const [, first, second] = pathname.split("/");
  const candidate = first === "c" ? second?.split("-")[0] : first;
  return genders.find((g) => g === candidate) ?? null;
}

/** Editorial pages shown next to the gender tabs. */
export const brandLinks: readonly NavLink[] = [
  { label: "Lookbook", href: "/lookbook" },
  { label: "About", href: "/about" },
];

export const accountLinks: readonly NavLink[] = [
  { label: "My account", href: "/account" },
  { label: "Orders", href: "/account/orders" },
  { label: "Wishlist", href: "/account/wishlist" },
];

export const footerNav: readonly NavColumn[] = [
  {
    title: "Shop",
    links: [
      ...genderNav.map(({ label, href }) => ({ label, href })),
      { label: "Search", href: "/search" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Shipping", href: "/shipping" },
      { label: "Returns & refunds", href: "/returns" },
      { label: "Track an order", href: "/account/orders" },
      { label: "Contact us", href: "/contact" },
      { label: "Grievance redressal", href: "/contact#grievance-officer" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Lookbook", href: "/lookbook" },
      { label: "Privacy notice", href: "/privacy" },
      { label: "Terms of service", href: "/terms" },
    ],
  },
];
