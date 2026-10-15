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
- [ ] 🔧 `SENTRY_DSN` is in `.env.example` but **`@sentry/nextjs` isn't installed and there's no Sentry init code anywhere** — error tracking isn't actually wired up despite the env var existing
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

## 3. SEO (CLAUDE.md phase 8 — not started)

- [ ] ❌ `app/sitemap.ts` — doesn't exist yet
- [ ] ❌ `app/robots.ts` — doesn't exist yet
- [ ] ❌ Product + Offer JSON-LD on PDPs — no structured data anywhere in `app/` yet
- [x] `generateMetadata`/`metadata` exports — actually already present on all 40 `page.tsx` files, including noindex on admin/account pages
- [ ] OG images (metadata has titles/descriptions everywhere; no image generation confirmed)

## 4. Analytics & observability

- [ ] ❌ No analytics wired in at all yet (Plausible or Vercel Analytics — CLAUDE.md leaves the choice to you)
- [ ] ❌ Sentry not installed (see §1)
- [ ] Decide what "it's broken" alerting looks like before launch — right now failures mostly surface as `console.error` (e.g. the late-payment case, webhook failures), which nobody's watching in production

## 5. Security

- [x] Baseline security headers set (`next.config.ts`): HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`
- [ ] 🔧 No CSP yet — deliberately deferred per the code comment (Razorpay's checkout script/frames need a tested allow-list first); don't forget to come back to this
- [x] Admin is gated three ways (`proxy.ts`, `requireAdmin()` in the admin layout, RLS via `is_admin()`) — no separate action needed, just noting it's actually solid
- [x] RLS covers the reviewed tables (per `supabase/tests/database/rls.test.sql`)
- [ ] Re-run `get_advisors` (Supabase security/performance advisors) once there's a real hosted project

## 6. Testing & CI

- [x] DB-level tests exist (`supabase/tests/database/{checkout,compliance,rls}.test.sql` — pgTAP), covering the atomic checkout/payment logic specifically
- [ ] ❌ No CI pipeline at all (no `.github/workflows`) — `pnpm build`/`lint`/`typecheck`/the pgTAP suite aren't run automatically anywhere; right now the only check is whoever remembers to run them locally
- [ ] ❌ No component or end-to-end tests (no Vitest/Playwright) — the checkout race condition ("two browsers, one item") that CLAUDE.md phase 5 calls out is untested beyond manual/DB-level checks
- [ ] Lighthouse mobile run (CLAUDE.md's ≥90 target) — not done yet, needs a deployed or production-built instance

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
