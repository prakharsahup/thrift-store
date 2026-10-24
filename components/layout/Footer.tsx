import Link from "next/link";
import { MotionToggle } from "@/components/motion/MotionToggle";
import { business, formatAddress } from "@/lib/config/legal";
import { footerNav } from "@/lib/config/navigation";
import { site } from "@/lib/config/site";
import { Logo } from "./Logo";
import { NewsletterForm } from "./NewsletterForm";

export function Footer() {
  return (
    // Extra bottom padding below lg so the fixed bottom nav never covers the last row.
    <footer className="border-t border-border bg-surface pb-16 lg:pb-0">
      <div className="site-container grid gap-10 py-12 lg:grid-cols-[2fr_3fr] lg:gap-16">
        <div className="space-y-6">
          <Logo size="footer" />
          <p className="max-w-xs text-sm text-muted">{site.tagline}</p>
          <NewsletterForm />
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {footerNav.map((column) => {
            const headingId = `footer-${column.title.toLowerCase()}`;
            return (
              <div key={column.title}>
                <h2
                  id={headingId}
                  className="mb-3 font-body text-xs font-semibold tracking-wider text-muted uppercase"
                >
                  {column.title}
                </h2>
                <ul aria-labelledby={headingId} className="space-y-2">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm hover:text-primary hover:underline">
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

      <div className="border-t border-border">
        <div className="site-container flex flex-col gap-4 py-6 text-xs text-muted lg:flex-row lg:items-center lg:justify-between">
          <ul aria-label="Social media" className="flex flex-wrap gap-x-4 gap-y-2">
            {site.socials.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-fg hover:underline"
                >
                  {social.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
          <p>
            <span className="font-medium text-fg">We accept:</span>{" "}
            {site.paymentMethods.join(" · ")}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <p>
              © {new Date().getFullYear()} {site.name}
            </p>
            <MotionToggle />
          </div>
        </div>
      </div>

      {/* Seller details (E-Commerce Rules 2020 r. 4(2)) and standing disclosures. */}
      <div className="border-t border-border">
        <div className="site-container space-y-1 py-6 text-xs text-muted">
          <p>
            {site.name} is operated by{" "}
            <span className="font-medium text-fg">{business.legalName}</span>,{" "}
            {formatAddress().join(", ")}.{business.gstin ? ` GSTIN: ${business.gstin}.` : ""}
            {business.cin ? ` CIN: ${business.cin}.` : ""} Customer care:{" "}
            <a href={`mailto:${business.email}`} className="underline hover:text-fg">
              {business.email}
            </a>{" "}
            · {business.phone}.
          </p>
          <p>
            Prices are set in Indian rupees and include all Indian taxes; from abroad they&rsquo;re
            shown converted into your currency as an estimate. Every item is pre-owned unless marked
            &ldquo;New with tags&rdquo;. Brand names and trademarks belong to their owners; we
            resell genuine pieces and aren&rsquo;t affiliated with or endorsed by any brand.
          </p>
        </div>
      </div>
    </footer>
  );
}
