// Placeholder brand values — the owner will replace these.
export const site = {
  name: "Baaki.store",
  tagline: "baaki - what remains",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "en-IN",
  // Shown after the free-shipping message in the announcement bar. Placeholder copy.
  announcements: ["New drop every Friday, 8 PM", "Every piece graded & measured"],
  // Profile URLs. YouTube and WhatsApp are still placeholders (bare platform homepages).
  socials: [
    { label: "Instagram", href: "https://www.instagram.com/baaki.store/" },
    { label: "YouTube", href: "https://www.youtube.com/" },
    { label: "WhatsApp", href: "https://www.whatsapp.com/" },
  ],
  paymentMethods: ["UPI", "Visa", "Mastercard", "RuPay", "Netbanking"],
} as const;
