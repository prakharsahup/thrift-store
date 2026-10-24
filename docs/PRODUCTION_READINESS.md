# Production readiness checklist

Technical go-live checklist — everything outside legal/policy content, which lives in
[`COMPLIANCE.md`](./COMPLIANCE.md) (fill in `lib/config/legal.ts` and get a lawyer/CA review before
launch regardless of where this list stands). Started 2026-10-14, based on reading the current code
— re-check items before launch, this drifts as the project moves.

Legend: ✅ done · 🔧 code exists, needs a real value/config from the owner · ❌ not built yet

## 1. Secrets & environment

- [ ] 🔧 Real Razorpay **test** keys in `.env.local` (`NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) — unconfirmed whether these are set yet
- [ ] 🔧 Razorpay webhook registered in their Dashboard (Settings → Webhooks) pointing at `/api/razorpay/webhook`, subscribed to `payment.captured` + `payment.failed`, secret copied into `RAZORPAY_WEBHOOK_SECRET` — dashboard-only, nothing in code does this for you
- [ ] 🔧 `RESEND_API_KEY` + verified sending domain in Resend (without it, prod silently skips every email — order confirmations, status updates, support tickets, the new owner order-alert)
- [ ] 🔧 `business.email` (`lib/config/legal.ts`) or `SUPPORT_INBOX`/`ORDER_NOTIFICATION_EMAIL` set to a real inbox — right now `business.email` is still the `[support@yourdomain.in]` placeholder, so support alerts and order-notification emails are silently skipped
- [ ] 🔧 `NEXT_PUBLIC_SITE_URL` set to the real domain (defaults to `http://localhost:3000`) — this feeds metadata, emails, sitemap links, JSON-LD
- [x] ✅ Production Supabase project — hosted project "xyz-thrift" (ap-south-1) is live and is the only database; local Docker/CLI dev stack was removed 2026-10-15
- [ ] 🔧 `@sentry/nextjs` installed and wired 2026-10-24 (`instrumentation.ts`, `instrumentation-client.ts`, `next.config.ts`'s `withSentryConfig`) — inert until `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN` are set in `.env.local`/Vercel; events tunnel through `/monitoring` (same-origin) so nothing needed in the CSP
- [ ] 🔧 Decide on `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED` / `NEXT_PUBLIC_AUTH_PHONE_ENABLED` for launch (both `false` by default — phone sign-in needs a real SMS provider configured in Supabase, Google needs OAuth credentials)

## 2. Payments (Razorpay)

Code-complete — see the earlier review: atomic reservations, idempotent `mark_order_paid`, HMAC
verification on both the verify route and the webhook, race-safe item locking, abandoned-order
cron, and an owner email alert (including the late-payment/manual-refund edge case, fixed
2026-10-14).

- [ ] Click through one real payment in Razorpay **test mode** with the actual Checkout modal (only ever tested with dummy keys + manually signed callbacks so far)
- [ ] Confirm the webhook actually fires end-to-end against a public URL (needs a tunnel locally, or just test against a deployed preview)
- [ ] Decide the swap plan from test keys → live keys (who flips it, when, and re-test immediately after)
- [ ] Watch `ORDER_NOTIFICATION_EMAIL` for the first few real orders to make sure it's landing

## 3. SEO (CLAUDE.md phase 8)

- [x] `app/sitemap.ts` — added 2026-10-24: static pages, `/men|women|unisex`, every category, every published drop, every listed product (`lib/server/catalogue.ts` `getSitemapProducts`/`getAllCategorySlugs`)
- [x] `app/robots.ts` — added 2026-10-24: blocks `/admin`, `/account`, `/checkout`, `/cart`, `/order`, `/notify/confirm`, `/dev`; disallows everything when `VERCEL_ENV` isn't `production` (so preview deployments never get indexed)
- [x] Product + Offer JSON-LD — added 2026-10-24 on the PDP only (`components/seo/JsonLd.tsx`, wired into `app/(store)/p/[slug]/page.tsx`); category/listing pages have no structured data yet
- [x] `generateMetadata`/`metadata` exports — present on all `page.tsx` files, including noindex on admin/account pages
- [x] OG images — `app/opengraph-image.png`/`twitter-image.png`/`icon.png`/`apple-icon.png` already exist as static site-wide defaults; no per-product dynamic OG image yet (lower priority — a generic brand image is fine for launch)

## 4. Analytics & observability

- [x] `@vercel/analytics` added 2026-10-24 (`<Analytics />` in `app/layout.tsx`) — owner picked Vercel Analytics over Plausible. No-ops unless deployed on Vercel with Analytics enabled for the project (Vercel dashboard → project → Analytics tab)
- [x] Sentry installed, see §1 — still needs a real DSN to actually report anything
- [ ] Decide what "it's broken" alerting looks like before launch — Sentry will now catch unhandled errors once a DSN is set, but webhook/late-payment failures still only reach `console.error`, not an alert

## 5. Security

- [x] Baseline security headers set (`next.config.ts`): HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`
- [x] 🔧 CSP added 2026-10-24 (`next.config.ts`), allow-listing `checkout.razorpay.com`/`api.razorpay.com`/`*.razorpay.com`, the Supabase origin (storage images + REST/Realtime), and `placehold.co`/`images.vendoo.co`. Built from Razorpay's documented domains, **never exercised against a real Checkout modal** — re-test with real test-mode keys and watch the browser console for new violations before relying on it
- [x] Admin is gated three ways (`proxy.ts`, `requireAdmin()` in the admin layout, RLS via `is_admin()`) — no separate action needed, just noting it's actually solid
- [x] RLS covers the reviewed tables (per `supabase/tests/database/rls.test.sql`)
- [ ] Re-run `get_advisors` (Supabase security/performance advisors) once there's a real hosted project

## 6. Testing & CI

- [x] DB-level tests exist (`supabase/tests/database/{checkout,compliance,rls}.test.sql` — pgTAP), covering the atomic checkout/payment logic specifically; still not run by CI (needs a Postgres/pgTAP service container — dropped along with Docker, see project memory)
- [x] CI pipeline added 2026-10-24 (`.github/workflows/ci.yml`): runs `format:check`/`lint`/`typecheck`/`build` on push to `main` and on every PR, with placeholder Supabase env vars (real secrets aren't needed for a plain build — `lib/env.ts` degrades catalogue reads to empty results without them)
- [ ] ❌ No component or end-to-end tests (no Vitest/Playwright) — the checkout race condition ("two browsers, one item") that CLAUDE.md phase 5 calls out is untested beyond manual/DB-level checks
- [x] Lighthouse mobile run, 2026-10-24, against a real `pnpm build` + `next start` on `/`: **performance 81** (target ≥90), accessibility 96, best-practices 96, **SEO 100**. Gaps found: LCP 4.7s, apparently driven by hotlinked `images.vendoo.co` photos occasionally 504ing; two pre-existing `color-contrast` failures on the lavender `#8855d9` accent against both light and dark backgrounds (4.21:1 and 3.98:1, need 4.5:1) — a brand-color decision, not touched here. Re-run per page before launch, not just `/`

## 7. Content & brand placeholders

Cross-reference with `COMPLIANCE.md` §1 for the legal ones. Also still placeholder:

- [ ] `site.ts`: `tagline`, `announcements`, and all three `socials` hrefs (Instagram/YouTube/WhatsApp all point at the bare platform homepages)
- [ ] `lib/config/legal.ts`: every `[BRACKETED]` value — legal name, address, GSTIN, grievance officer, jurisdiction city
- [ ] `lib/config/legal.ts` `tax.hsn`/`pricesIncludeTax` — flagged in code as needing a CA's confirmation
- [ ] `lib/config/shipping.ts` flat/free-shipping thresholds — currently placeholder ₹79 / ₹999
- [ ] Seed data (`supabase/seed.sql`, ~40 placeholder products) needs replacing with real inventory before go-live, or at minimum removing from a production seed run

## 8. Hosting & domain

- [ ] Pick Vercel Pro or Netlify (CLAUDE.md: Hobby tier is non-commercial, so it's not actually an option for a real store) and connect the real domain + DNS
- [ ] Verify the sending domain in Resend against that same domain (SPF/DKIM) — emails from an unverified domain land in spam
- [ ] Decide whether `app/robots.ts`/`sitemap.ts` (once built) should block the preview/staging deployment from being indexed

## 9. Remaining feature phases (per CLAUDE.md §10 / project memory)

- [x] Drops & notify-me: `notify_requests` table, `request_notify`/`confirm_notify` (double opt-in), admin drops page, and `/drops/[slug]` all exist already
- [ ] Confirm the back-in-stock wishlist email (CLAUDE.md phase 7: "if it returns to available, the user gets an email") is actually wired — not verified in this pass
- [ ] Final launch-prep pass once the above settles: re-run the full "Definition of done" from CLAUDE.md §14 (build/lint/typecheck, 360/1280px check, keyboard nav, no secrets in client bundle, RLS on anything new)

---

Update this file as items get done — flip `❌`/`🔧` to `✅`/`[x]` and add anything new that comes up.
