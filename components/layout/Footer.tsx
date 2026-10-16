import Link from "next/link";
import { DropAlertForm } from "@/components/drops/DropAlertForm";
import { MotionToggle } from "@/components/motion/MotionToggle";
import { business, formatAddress } from "@/lib/config/legal";
import { footerNav } from "@/lib/config/navigation";
import { site } from "@/lib/config/site";
import type { FeaturedDrop, ShopMenuItem } from "@/lib/server/catalogue";
import { Logo } from "./Logo";
import { HideOnPaths } from "./HideOnPaths";
import { NewsletterForm } from "./NewsletterForm";

type Props = {
  menu: ShopMenuItem[];
  /** The featured drop: before it goes live, the sign-up becomes a real drop alert for it. */
  drop: FeaturedDrop | null;
};

const linkClass = "text-sm hover:text-accent hover:underline";

// Drop Night footer: the drop-alert sign-up as a poster line, then a quiet link row, then the
// legally required seller details.
export function Footer({ menu, drop }: Props) {
  const columns = [
    {
      title: "Shop",
      links: [
        ...menu.map(({ name, href }) => ({ label: name, href })),
        { label: "Search", href: "/search" },
      ],
    },
    ...footerNav,
  ];

  return (
    // Extra bottom padding below lg so the fixed bottom nav never covers the last row.
    <footer className="bg-bg pb-16 lg:pb-0">
      <div className="site-container border-t border-border">
        {/* Drop pages carry their own alert sign-up for that drop. */}
        <HideOnPaths prefixes={["/drops/"]}>
          <section
            id="drop-alert"
            aria-labelledby="footer-alert"
            className="grid gap-8 py-14 md:py-20 lg:grid-cols-2 lg:items-end lg:gap-16"
          >
            <h2 id="footer-alert" className="max-w-xl text-2xl text-accent md:text-3xl">
              Get the alert before the drop.
            </h2>
            {drop && !drop.isLive ? (
              <DropAlertForm
                dropId={drop.id}
                id="footer-drop-alert-email"
                className="lg:justify-self-end"
              />
            ) : (
              <NewsletterForm />
            )}
          </section>
        </HideOnPaths>

        <div className="grid gap-10 border-t border-border py-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
          <div className="space-y-3">
            <Logo />
            <p className="max-w-xs text-sm text-muted">{site.tagline}</p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((column) => {
              const headingId = `footer-${column.title.toLowerCase()}`;
              return (
                <div key={column.title}>
                  <h3
                    id={headingId}
                    className="mb-3 text-xs font-bold tracking-widest text-muted uppercase"
                  >
                    {column.title}
                  </h3>
                  <ul aria-labelledby={headingId} className="space-y-2">
                    {column.links.map((link) => (
                      <li key={link.href}>
                        <Link href={link.href} className={linkClass}>
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-4 border-t border-border py-6 text-xs text-muted lg:flex-row lg:items-center lg:justify-between">
          <ul aria-label="Social media" className="flex flex-wrap gap-x-5 gap-y-2">
            {site.socials.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-accent hover:text-fg hover:underline"
                >
                  {social.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
          <p>
            <span className="font-semibold text-fg">We accept:</span>{" "}
            {site.paymentMethods.join(" · ")}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <p>
              © {new Date().getFullYear()} {site.name}
            </p>
            <MotionToggle />
          </div>
        </div>

        {/* Seller details (E-Commerce Rules 2020 r. 4(2)) and standing disclosures. */}
        <div className="space-y-1 border-t border-border py-6 text-xs text-muted">
          <p>
            {site.name} is operated by{" "}
            <span className="font-semibold text-fg">{business.legalName}</span>,{" "}
            {formatAddress().join(", ")}.{business.gstin ? ` GSTIN: ${business.gstin}.` : ""}
            {business.cin ? ` CIN: ${business.cin}.` : ""} Customer care:{" "}
            <a href={`mailto:${business.email}`} className="underline hover:text-fg">
              {business.email}
            </a>{" "}
            · {business.phone}.
          </p>
          <p>
            All prices are in Indian rupees and include all taxes. Every item is pre-owned unless
            marked &ldquo;New with tags&rdquo;. Brand names and trademarks belong to their owners;
            we resell genuine pieces and aren&rsquo;t affiliated with or endorsed by any brand.
          </p>
        </div>
      </div>
    </footer>
  );
}
