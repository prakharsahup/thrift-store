# Legal compliance checklist

What an Indian online thrift store needs, what the site already does about it, and what only the
owner can do. Last reviewed 2026-10-06.

> **Not legal advice.** This list and the policy pages are a well-researched starting point, not a
> lawyer's opinion. Before launch, have a lawyer review the policy pages, and a CA confirm GST
> treatment. Laws and rules change; re-check at least once a year.

Legend: ✅ done in code · ⚙️ done in code, needs the owner's details/decision · 🧑 owner action
(no code) · ⏳ later phase

## 1. Fill in first (blocks launch)

Every value in `[SQUARE BRACKETS]` in **`lib/config/legal.ts`** is a placeholder that shows up on
the site. Fill these in before going live:

- [ ] Legal business name, entity type, registered address
- [ ] GSTIN (or `null` if not registered), CIN/LLPIN if any
- [ ] Customer-care email and phone (the E-Commerce Rules ask for both email and phone numbers)
- [ ] Grievance Officer: name, email, phone (must be a real person who answers)
- [ ] Jurisdiction city for the terms
- [ ] Returns decisions: change-of-mind returns on/off, window (7 days), pickup fee (₹99)
- [ ] Shipping times (dispatch 2 days, delivery 3–7 days) and charges (`lib/config/shipping.ts`)
- [ ] `SUPPORT_INBOX` env var (where contact-form messages go)
- [ ] Bump `policyUpdated` dates whenever a policy's wording changes

## 2. Consumer Protection Act 2019 + Consumer Protection (E-Commerce) Rules 2020

We are an **inventory e-commerce entity** (we sell our own stock), so Rules 4 and 6 apply.

| Requirement | Where | Status |
|---|---|---|
| Show legal name, address, website, customer-care email + phone (r. 4(2)) | Footer, `/contact`, `/terms`, every email footer, receipts | ⚙️ |
| Appoint a Grievance Officer; show name, designation, contact (r. 4(4)) | `/contact#grievance-officer`, `/privacy`, `/terms`, footer link | ⚙️ |
| Acknowledge complaints within 48 h with a ticket number; resolve within 1 month (r. 4(5)) | Contact form → `support_requests` ticket, instant acknowledgement email, admin inbox `/admin/messages` with 30-day countdown, resolution email | ✅ |
| No cancellation charges unless we bear the same when we cancel (r. 4(7)) | Cancellation is always free (`/returns#cancel`) | ✅ |
| Explicit consent; no pre-ticked boxes (r. 4(9)) | No pre-ticked boxes anywhere on the storefront; consent notices at sign-in and checkout | ✅ |
| Refunds within a reasonable time, per RBI rules (r. 4(10)) | `/returns#refunds`: start within 2 business days, bank 5–7 days | ✅ |
| Info on returns, refunds, exchange, warranty, delivery, payment methods, grievance mechanism (r. 6(5)(a)) | `/returns`, `/shipping`, `/terms#payments`, `/contact`; summary box on every product page | ✅ |
| Payment info: methods, security, fees, chargebacks, payment provider contact (r. 6(5)(b)) | `/terms#payments` | ✅ |
| All relevant product details incl. **country of origin** (r. 6(5)(c)) | New `country_of_origin` field (admin form → product page); condition, measurements, flaws, new vs pre-owned | ✅ (fill it in for each listing) |
| Total price with breakdown of all charges before payment | Cart, checkout and receipts show subtotal, shipping, discount, total; "inclusive of all taxes" | ✅ |
| Must take back + refund goods that are defective, not as described, spurious, or late (r. 6(6)) | "Not as described" returns always accepted, even with change-of-mind returns off; late-delivery cancellation | ✅ |
| Ads/listings match the real item (r. 6(4)); no false reviews (r. 6(7)) | Condition grades, flaw photos, measurement tolerance; no reviews feature | ✅ |
| "Est. retail" comparison must not mislead (unfair trade practice) | Labelled "est. retail" with an explanation of how it's worked out (`/terms#prices`) | ✅ — only enter it when you have a real basis |

## 3. Dark patterns — CCPA Guidelines 2023

The CCPA has asked e-commerce businesses to **self-audit for dark patterns** and keep a record.

| Pattern | Our position |
|---|---|
| False urgency | The 15-minute hold and drop countdowns are real timers, not fake. Keep it that way: no "X people are viewing", no fake low-stock |
| Basket sneaking / drip pricing | Shipping shown in cart before checkout; nothing is added at payment; no hidden fees |
| Confirm shaming | Decline buttons are neutral ("Keep my account") |
| Forced action / subscription trap | Account not needed to browse; deleting the account and unsubscribing are one screen away (`/account/privacy`) |
| Interface interference / trick questions | No pre-ticked boxes; plain-language consent text |
| Disguised ads | None. Label any paid collaborations as ads |

- [ ] 🧑 Do and date a self-audit before launch (and after big UI changes); keep a copy.

## 4. Digital Personal Data Protection Act 2023 + DPDP Rules 2025

Most obligations under the Rules come into force in phases (main duties ~May 2027). Built in now so
there's no scramble later. The IT (Reasonable Security Practices) Rules 2011 apply until then and
also require a published privacy policy and grievance officer.

| Requirement | Where | Status |
|---|---|---|
| Clear, itemised notice: what data, why, rights, how to complain to the Board | `/privacy` | ⚙️ (keep the processor and cookie tables accurate) |
| Notice at the point of collection | Sign-in page, contact form, newsletter, checkout | ✅ |
| Consent by clear affirmative action; withdraw as easily as given | Marketing only via opt-in; one-click "Unsubscribe from all alerts" | ✅ |
| Right to access | `/account/privacy` → Download my data (JSON) | ✅ |
| Right to correction | Profile and addresses editable; contact form for the rest | ✅ |
| Right to erasure | `/account/privacy` → Delete my account (keeps order records required by tax law, unlinked) | ✅ |
| Right to nominate; grievance redressal | `/privacy#rights`, contact form topic "My personal data" | ✅ |
| Children (under 18): verifiable parental consent or don't process | Store is 18+ only (sign-in notice + terms) | ✅ |
| Retention limits + erasure | Policy table in `/privacy#retention`; unconfirmed sign-ups purged after 7 days; resolved tickets purged after 3 years (cron) | ✅ |
| Keep security logs ≥ 1 year | Supabase/Vercel log retention | 🧑 check your plan's log retention |
| Reasonable security safeguards | RLS on every table, secrets server-only, HTTPS, security headers (`next.config.ts`) | ✅ (CSP still to add, see §9) |
| Breach notification to users and the Data Protection Board | — | 🧑 write a 1-page breach plan: who decides, notify Board + users without delay, 72-hour detailed report |
| Contracts with data processors | — | 🧑 accept/download the DPAs of Supabase, Vercel, Razorpay, Resend, SMS provider |
| Cookie consent | Only essential cookies/storage today, so no banner needed | ⏳ add a consent banner **before** adding any non-essential analytics or ad pixels |

## 5. Payments — RBI and Razorpay

| Requirement | Status |
|---|---|
| Razorpay activation needs live About, Contact, Privacy, Terms, Refund/Cancellation and Shipping pages with real business details | ⚙️ pages built; fill in `lib/config/legal.ts` |
| Never store card data (RBI tokenisation rules) | ✅ card details go straight to Razorpay |
| Failed-transaction auto-reversal timelines (RBI TAT circular) | ✅ explained in `/terms#payments` and `/returns#refunds` |
| 🧑 Complete Razorpay KYC with the same business name/address as the site | owner |
| 🧑 Settlement bank account in the business's name (current account for a firm/company) | owner |

## 6. Tax — GST and income tax

- [ ] 🧑 **GST registration — likely needed before the first sale.** Shipping goods to buyers in
  other states is an inter-state supply, and CGST Act s. 24(i) requires registration for that
  regardless of turnover (the ₹40 lakh / ₹20 lakh thresholds only help businesses selling within
  their own state). Since the site ships across India, register before launch unless a CA advises
  otherwise. Then set `business.gstin`.
- [ ] 🧑 **Rate and HSN**: worn clothing is HSN 6309 (set in `lib/config/legal.ts → tax`). Confirm
  the rate with a CA.
- [ ] 🧑 **Margin scheme** (CGST Rule 32(5)): dealers in second-hand goods may pay GST only on their
  margin if no input tax credit is claimed. Ask a CA whether it suits you.
- [ ] 🧑 **Tax invoices**: the site gives every paid order a printable receipt (`/order/[id]/receipt`)
  with seller details, GSTIN, HSN, place of supply and totals. If you're registered, ask your CA
  whether to extend it into a full tax invoice (invoice series, tax split) or issue invoices from
  accounting software.
- [ ] 🧑 Keep books and records for 8 years (GST: 72 months after the annual return). Orders are
  never deleted from the database, even when an account is deleted.

## 7. Business registrations (owner)

- [ ] 🧑 Business entity (sole proprietorship, partnership, LLP or private limited) and PAN
- [ ] 🧑 Shops & Establishments registration under your state's Act (even for an online-only business with a premises)
- [ ] 🧑 Udyam (MSME) registration — optional, free, useful for banking
- [ ] 🧑 Trademark search, then file for the store name and logo (classes 25 and 35)
- [ ] 🧑 Domain in the business's name; email domain verified in Resend (SPF/DKIM/DMARC)

## 8. Thrift-specific rules

- [ ] 🧑 **Sourcing**: importing second-hand/worn clothing into India is restricted (DGFT ITC-HS
  6309; generally needs an import licence). Buy from domestic sources, or get an Import Export Code
  and the licence. The About page mentions "wholesale vintage bales" — make sure that's true and
  lawful for your sources.
- [ ] 🧑 **Authenticity**: selling counterfeit goods is an offence under the Trade Marks Act 1999.
  Reselling genuine goods is fine. Check every branded piece; the terms promise a full refund for
  anything not genuine. Never use brand logos as your own branding (the footer has a
  "not affiliated" disclaimer).
- [ ] 🧑 **Hygiene**: don't list used innerwear or swimwear bottoms; clean every piece (the site
  claims "inspected and cleaned").
- [ ] 🧑 **Accessories**: if you ever sell gold jewellery, BIS hallmarking is mandatory; for
  cosmetics, food or electronics, other licences apply — stick to clothing, bags and accessories.
- [ ] 🧑 **Country of origin**: fill it in from the label for every listing (or leave blank if the
  label doesn't say — the page then says "Not stated on the label").

## 9. Communications and technical

| Item | Status |
|---|---|
| SMS sign-in codes: **TRAI DLT** registration of sender ID and OTP template (via your SMS provider) | 🧑 required before phone sign-in goes live |
| Marketing emails: opt-in only, unsubscribe link in every marketing email | ✅ opt-in + account unsubscribe; ⏳ add an unsubscribe link to drop/restock alert emails when phase 9 builds them |
| Transactional emails show seller details and help links | ✅ |
| Content-Security-Policy header | ⏳ add after testing Razorpay checkout with live keys |
| Accessibility (WCAG 2.1 AA) — RPwD Act 2016 and good practice | ✅ built to AA; 🧑 re-audit before launch |
| Analytics (Plausible / Vercel) | ⏳ cookieless options need no banner; update the privacy notice's processor list |
| Error monitoring (Sentry) | ⏳ add to the processor list in `/privacy` when enabled; scrub PII |

## 10. What changed in the code (2026-10-06)

- `lib/config/legal.ts` — single source of business identity, grievance officer, policy numbers
- Policy pages rewritten: `/terms`, `/privacy`, `/returns`, `/shipping`, `/contact` (now indexable)
- Contact/grievance form → `support_requests` table (migration `20261006120000_compliance.sql`),
  acknowledgement email with ticket number, admin inbox at `/admin/messages`
- `/account/privacy`: download data, unsubscribe, delete account
- Product page: tax-inclusive note, est. retail explanation, country of origin, new vs pre-owned,
  delivery/returns/seller summary
- Cart/checkout: tax-inclusive note, terms acceptance notice before paying
- Sign-in: 18+ and terms/privacy notice
- Order page: "Cancel or get help" and printable receipt
- Footer: seller details, grievance link, brand disclaimer; emails: legal footer
- Security headers in `next.config.ts`; site chrome hidden when printing
