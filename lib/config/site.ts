// Placeholder brand values — the owner will replace these.
export const site = {
  name: "Baaki.store",
  tagline: "baaki - what remains",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "en-IN",
  // The announcement bar's messages (no sale or free-shipping promos, owner decision).
  announcements: ["Every piece graded & measured"],
  // Shown in the footer.
  socials: [{ label: "Instagram", href: "https://www.instagram.com/baaki.store/" }],
  paymentMethods: ["UPI", "Visa", "Mastercard", "RuPay", "Netbanking"],
} as const;
