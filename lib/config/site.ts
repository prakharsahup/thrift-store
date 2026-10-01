// Placeholder brand values — the owner will replace these.
export const site = {
  name: "xyz",
  tagline: "Pre-loved fashion, graded and measured. One of one.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "en-IN",
  // Shown after the free-shipping message in the announcement bar. Placeholder copy.
  announcements: ["New drop every Friday, 8 PM", "Every piece graded & measured"],
  // Placeholder profile URLs — swap for the store's real handles.
  socials: [
    { label: "Instagram", href: "https://www.instagram.com/" },
    { label: "YouTube", href: "https://www.youtube.com/" },
    { label: "WhatsApp", href: "https://www.whatsapp.com/" },
  ],
  paymentMethods: ["UPI", "Visa", "Mastercard", "RuPay", "Netbanking"],
} as const;
