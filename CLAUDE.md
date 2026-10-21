# CLAUDE.md — [STORE_NAME] Thrift Store

> Project guide for Claude Code. Read this whole file before writing any code.
> Placeholders in `[BRACKETS]` are filled in by the owner — ask if one blocks you.

---

## 1. What we're building

A production-grade e-commerce site for **[STORE_NAME]**, a thrift / pre-loved fashion store selling in India.

**UX reference:** the *patterns* common to large Indian fashion e-commerce sites:
- sticky header with Men / Women / Unisex tabs and a hover mega-menu
- full-width hero banner carousel
- category tiles and "shop by" rails (brand, style, price)
- product grid with filters and sorting
- product detail page (PDP) with image gallery
- slide-out cart drawer
- mobile bottom navigation bar

**Not a clone.** All branding, copy, imagery, icons, and code are original to this project.

**Brand feel:** [e.g. bold, youthful streetwear energy, playful but clean]
**Audience:** [e.g. 18–30, students and young professionals, mobile-first]

---

## 2. Hard rules (never break these)

1. **No third-party assets.** Never scrape, fetch, or copy code, images, logos, product photos, fonts, or copy from any other website.
   - Use placeholder images (`https://placehold.co/...` or local `/public/placeholders/`) and write original copy.
2. **No new dependencies without asking.** The approved stack is in section 3. Propose any addition with a one-line reason first.
3. **Work phase by phase** (section 10). Finish one phase, run checks, summarize what changed, then STOP for review.
4. **TypeScript strict.** No `any`, no `@ts-ignore` without a comment explaining why.
5. **Server Components by default.** Add `"use client"` only for interactivity (state, effects, event handlers, browser APIs).
6. **Secrets never reach the client.**
   - `SUPABASE_SERVICE_ROLE_KEY` and `RAZORPAY_KEY_SECRET` are only used in server code (`/lib/server`, route handlers, server actions).
   - Only `NEXT_PUBLIC_*` variables may be read in client code.
7. **Money is stored as an integer smallest-unit amount** ($499 = `49900` cents).
   - Format only at render time with `formatMoney()` from `/lib/utils/money.ts`.
8. **Never trust the client for prices, stock, or totals.** Recompute everything on the server at checkout.
9. **Mobile-first.** Build every component at 360px width first, then scale up.
10. **Explain as you go.** After each feature, briefly say which files were added and whether each is a server or client component.

---

## 3. Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js (latest stable, App Router), TypeScript |
| Styling | Tailwind CSS v4 (CSS-first config with `@theme` in `app/globals.css`) |
| UI primitives | shadcn/ui (copy-in components in `/components/ui`) |
| Icons | lucide-react |
| Animation | GSAP (ScrollTrigger, SplitText) + `@gsap/react` + Lenis — follow `MOTION.md` for all animation work |
| Carousel | embla-carousel-react |
| Database / Auth / Storage | Supabase (`@supabase/supabase-js`, `@supabase/ssr`) |
| Forms / validation | react-hook-form + zod (zod schemas shared by client and server) |
| Client state | zustand (cart drawer + guest cart only) |
| Payments | Razorpay (UPI, cards, netbanking); COD optional in a later phase |
| Email | Resend + react-email (order confirmation, shipping update) |
| Analytics | Plausible or Vercel Analytics (owner decides) |
| Errors | Sentry |
| Hosting | Vercel Pro (Hobby is non-commercial) or Netlify |
| Package manager | pnpm |

---

## 4. Thrift-specific domain rules (important — this is NOT a regular fashion store)

- **Every product is a single, unique item.** There are no size or colour variants and no stock counts.
  - One product = one physical piece.
- **Product status:** `draft` → `available` → `reserved` → `sold` (or back to `available` when a reservation expires).
- **Each product has:**
  - **Condition grade:** `new_with_tags` | `like_new` | `good` | `fair`, each with a visible description of what it means.
  - **Measurements** (cm): chest, length, shoulder, sleeve, waist, inseam, as applicable. Show these on the PDP, because thrift sizing is inconsistent.
  - **Tagged size** (as printed on the label), **brand**, **era/style tags** (e.g. y2k, vintage, streetwear), **flaws** (free text, shown honestly).
  - **Price** and optional **original retail price** (shown as "est. retail" with the saving).
- **Reservation:**
  - Adding to cart does NOT reserve an item.
  - Starting checkout reserves all cart items for **15 minutes** through an atomic Postgres function.
  - If any item is already reserved or sold, show which one and remove it from the order.
  - Expired reservations are released by a scheduled job (Supabase cron) and also lazily on read.
- **Sold items stay visible** for 7 days with a "SOLD" badge (social proof), then drop out of listings but keep their URL (no 404).
- **Drops:** products can belong to a `drop` with a `go_live_at` timestamp.
  - Before go-live, the drop page shows a countdown and "notify me" (email capture).
- **Wishlist / "watch"** an item. If it returns to `available`, the user gets an email.

---

## 5. Design system

Define these tokens once in `app/globals.css` under `@theme`. **Never hard-code colours, font sizes, or radii in components.**

```
--color-bg:        [#FFFFFF]
--color-fg:        [#111111]
--color-muted:     [#6B6B6B]
--color-primary:   [#______]   /* brand accent, CTAs */
--color-accent:    [#______]   /* badges, highlights */
--color-sale:      [#D7263D]
--color-sold:      [#9A9A9A]
--color-border:    [#E5E5E5]

--font-display:    [Display font]  /* headings — e.g. a bold grotesk from Fontshare */
--font-body:       [Body font]     /* body/UI */

--radius-sm: 4px;  --radius-md: 8px;  --radius-lg: 16px;
```

- **Fonts:** load with `next/font` (self-hosted). Use at most 2 families.
- **Type scale:** 12 / 14 / 16 / 18 / 24 / 32 / 48 / 64.
- **Spacing:** Tailwind's default 4px scale only.
- **Container:** max width 1440px, side padding 16px on mobile and 32px on desktop.
- **Breakpoints:** Tailwind defaults (sm 640, md 768, lg 1024, xl 1280).
- **Product cards:**
  - 2 columns on mobile, 3 on tablet, 4 on desktop.
  - Image ratio 3:4. Hovering on desktop swaps to the second image.
- **Accessibility:**
  - WCAG AA contrast.
  - Visible focus rings.
  - All interactive elements reachable by keyboard.
  - Drawers and modals trap focus and close on Esc.

---

## 6. Folder structure

```
app/
  (store)/
    page.tsx                    # Home
    [gender]/page.tsx           # /men, /women, /unisex landing
    c/[slug]/page.tsx           # Category listing (PLP)
    p/[slug]/page.tsx           # Product detail (PDP)
    drops/[slug]/page.tsx
    search/page.tsx
    cart/page.tsx               # full cart page (drawer is primary)
    checkout/page.tsx
    order/[id]/page.tsx         # confirmation
    account/                    # profile, orders, addresses, wishlist
    (legal)/                    # privacy, terms, shipping, returns, contact, about
  admin/                        # protected, role = admin
    products/ orders/ drops/ categories/ coupons/
  api/
    checkout/route.ts           # create order + Razorpay order
    razorpay/verify/route.ts
    razorpay/webhook/route.ts
  layout.tsx  globals.css  sitemap.ts  robots.ts  not-found.tsx
components/
  ui/                           # shadcn primitives
  layout/                       # Header, MegaMenu, Footer, MobileNav, AnnouncementBar
  product/                      # ProductCard, Gallery, ConditionBadge, MeasurementsTable
  cart/                         # CartDrawer, CartLine
  home/                         # HeroCarousel, CategoryTiles, ProductRail, DropBanner
lib/
  supabase/ (client.ts, server.ts, admin.ts)
  server/   (orders.ts, payments.ts, email.ts)   # server-only
  utils/    (money.ts, slug.ts, cn.ts)
  validators/                                   # zod schemas
supabase/
  migrations/                   # all schema changes as SQL migrations
  seed.sql                      # ~40 fake products with placeholder images
```

---

## 7. Data model (Supabase / Postgres)

Every schema change goes in `supabase/migrations/` as SQL, and RLS is enabled on every table.

- `profiles`: id (= auth.users.id), full_name, phone, role (`customer` | `admin`), created_at
- `categories`: id, name, slug, parent_id, gender (`men` | `women` | `unisex`), image_url, sort_order
- `drops`: id, name, slug, description, banner_url, go_live_at, is_published
- `products`:
  - id, slug, title, description, brand, category_id, drop_id
  - gender, tagged_size, condition, measurements (jsonb), flaws, style_tags (text[])
  - price_paise, original_price_paise
  - status, reserved_until, reserved_by, sold_at
  - created_at, published_at
- `product_images`: id, product_id, url, alt, sort_order
- `addresses`: id, user_id, name, phone, line1, line2, city, state, pincode, is_default
- `wishlists`: user_id, product_id, created_at (PK both)
- `orders`:
  - id, user_id, status (`pending` | `paid` | `packed` | `shipped` | `delivered` | `cancelled` | `refunded`)
  - subtotal_paise, shipping_paise, discount_paise, total_paise
  - address (jsonb snapshot)
  - razorpay_order_id, razorpay_payment_id, payment_method
  - tracking_url, created_at
- `order_items`: order_id, product_id, title_snapshot, price_paise_snapshot, image_snapshot
- `coupons`: code, type (`percent` | `flat`), value, min_order_paise, max_uses, used_count, expires_at, active
- `notify_requests`: email, drop_id or product_id, created_at

**RLS:**
- The public can read only `available` / `reserved` / recently `sold` products and published drops.
- Users read and write only their own addresses, wishlists, and orders.
- Admins have full access, checked with `is_admin()`, a SQL function based on `profiles.role`.

**Postgres functions (SECURITY DEFINER, called with `rpc`):**
- `reserve_products(product_ids uuid[], user_id uuid)`
  - Runs atomically: updates only rows that are `available` or have an expired reservation.
  - Returns the ids it could NOT reserve.
- `release_expired_reservations()`, scheduled every 5 minutes.
- `mark_order_paid(order_id, payment_id)`
  - Sets the order to `paid` and its products to `sold`.
  - Idempotent, so the webhook and the verify route can both call it safely.

---

## 8. Pages & features

### Storefront

- **Global layout:**
  - Announcement bar (free shipping threshold, current drop).
  - Sticky header: logo, gender tabs, mega-menu, search, wishlist, account, cart count.
  - Footer: links, newsletter signup, socials, payment icons as text labels.
  - Mobile: hamburger menu plus a bottom nav (Home, Categories, Search, Wishlist, Account).
- **Home:**
  - Hero carousel (admin-managed banners).
  - Category tiles.
  - "Just dropped" rail.
  - Upcoming drop banner with countdown.
  - "Shop by style" tiles (y2k, vintage, streetwear…).
  - "Under $[499]" rail.
  - Trust strip: authenticity, condition-graded, easy returns, COD if enabled.
- **Category page (PLP):**
  - Filters: category, tagged size, condition, brand, price range, style.
  - Sort: newest, price low→high / high→low.
  - Filter state lives in URL search params so links are shareable.
  - Paginated or "load more" (24 per page).
  - Filters open in a bottom sheet on mobile.
- **PDP:**
  - Image gallery (swipe on mobile, thumbnails on desktop, zoom).
  - Title, brand, price with est. retail, condition badge plus explanation.
  - Measurements table, flaws, description.
  - "Add to cart" (disabled with "SOLD" when sold), wishlist button.
  - "Only one available" note.
  - "You may also like" rail (same category or style).
- **Search:** Postgres full-text search over title, brand, and tags, with an instant-results dropdown in the header.
- **Cart drawer:**
  - Line items with remove.
  - Subtotal and shipping threshold progress bar.
  - Checkout button.
  - Guest cart lives in zustand + localStorage and merges into the account on login.
- **Checkout:**
  - Login or sign up (email OTP or Google), then address, then summary with coupon, then Razorpay.
  - Show a countdown for the 15-minute reservation.
- **Order confirmation and account:**
  - Order history with status and tracking link.
  - Addresses, wishlist, profile.
- **Legal pages:** privacy, terms, shipping, returns and refunds, contact, about. Required for Razorpay activation.

### Admin (`/admin`, role-gated in middleware AND RLS)

- **Product CRUD:**
  - Multi-image upload to Supabase Storage with drag-to-reorder.
  - All thrift fields from section 4.
  - "Duplicate product" to speed up listing similar items.
- **Order list and detail:** update status, add tracking URL. Changing the status emails the customer.
- Drops, categories, banners, and coupons management.
- **Dashboard:** today's orders, revenue, items listed vs sold.

---

## 9. Checkout & payment flow (Razorpay)

1. Client POSTs cart product ids, address id, and coupon to `/api/checkout`.
2. Server:
   - Validates with zod.
   - Calls `reserve_products`.
   - If any items fail, returns them so the UI can remove them.
3. Server recomputes totals from the DB (prices, coupon, shipping rule) and creates an `orders` row (`pending`) plus a Razorpay order with the same amount. Returns `razorpay_order_id`.
4. Client opens Razorpay Checkout.
5. On success, the client POSTs to `/api/razorpay/verify`. The server verifies the HMAC signature and calls `mark_order_paid`.
6. `/api/razorpay/webhook`:
   - Verifies the webhook signature.
   - Handles `payment.captured` by calling `mark_order_paid`. **This is the source of truth.**
   - Handles failed payments by releasing the reservations.
7. Send the confirmation email (Resend) and redirect to `/order/[id]`.

**Shipping rule:** flat $[XX], free above $[XXX]. Keep it in a single config file, `/lib/config/shipping.ts`.

---

## 10. Build phases (stop for review after each)

**Phase 0 — Setup**
- Next.js + TS + Tailwind v4 + shadcn + ESLint/Prettier + pnpm.
- Design tokens in place and fonts loaded.
- Supabase clients set up.
- `.env.example` created.
- Done when: the app runs with a token preview page at `/dev/tokens`.

**Phase 1 — Layout shell**
- Header, mega-menu, footer, mobile nav, announcement bar, 404.
- Done when: it's responsive at 360 / 768 / 1280 and keyboard-navigable.

**Phase 2 — Data and seed**
- Migrations, RLS, functions.
- `seed.sql` with ~40 products across categories using placeholder images.

**Phase 3 — Catalogue**
- Home, PLP with URL filters, PDP, search.
- Done when: all pages render from seeded data and are server-rendered.

**Phase 4 — Cart and auth**
- Cart drawer, guest cart, login (email OTP + Google), cart merge, wishlist.

**Phase 5 — Checkout and payments**
- Reservation, Razorpay test mode, verify route, webhook, confirmation email.
- Done when: the full purchase works in test mode and the item shows SOLD.
- Test the race: two browsers checking out the same item, only one succeeds.

**Phase 6 — Admin**
- Product CRUD with image upload, orders, drops, banners, coupons, dashboard.

**Phase 7 — Drops and notifications**
- Countdown pages, notify-me, back-in-stock email for watched items.

**Phase 8 — SEO, performance, polish**
- `generateMetadata` on every page.
- OG images.
- Product JSON-LD (`Product` + `Offer` with availability).
- `sitemap.ts`, `robots.ts`.
- Lighthouse mobile ≥ 90.
- Skeleton loaders, empty states, error boundaries.

**Phase 9 — Launch prep**
- Sentry, analytics, legal pages filled in.
- Razorpay live keys (owner does this).
- Domain, DNS, and email domain verified in Resend.

---

## 11. Conventions

- **Components:** PascalCase files; one component per file; props typed with `type Props = {...}`.
- **Data fetching:**
  - Fetch in Server Components or server actions through `/lib/supabase/server.ts`.
  - Never use `useEffect` for data fetching.
  - Mutations go through server actions, except the payment API routes.
- **Images:** always `next/image` with `sizes`, a meaningful `alt`, and `priority` only on the first hero image.
- **Caching:** mark product and listing pages for revalidation; call `revalidatePath`/`revalidateTag` after admin edits and when an item sells.
- **Errors:**
  - Each route segment has a `loading.tsx` and an `error.tsx`.
  - User-facing errors are friendly and say what to do next.
- **Server action return shapes.** Pick by how the action is called, not by habit:
  - **Bound to a `<form>` via `useActionState`:** return `FormState` (`lib/admin/form.ts`) — `{ status: "idle" | "saved" | "error", message, fieldErrors? }`. Build it with `invalidForm()`/`failedForm()`, not by hand.
  - **Called directly from a client component (button click, not a form):** return `ActionResult<T>` (`lib/cart/types.ts`) — `{ ok: true; data: T } | { ok: false; message: string; needsLogin?: boolean }`. Set `needsLogin: true` instead of redirecting from inside the action, so the client can decide (e.g. open the login modal vs. navigate).
  - **No useful result to hand back (admin delete/duplicate, one-way redirects):** `redirect()` or `throw` is fine — don't invent a result type nobody reads.
  - Don't introduce a fourth shape. If none of these fit, that's a sign the action is doing two things — split it.
- **Commits:** small, one feature each, conventional-commit messages (`feat:`, `fix:`, `chore:`).

---

## 12. Commands

```
pnpm dev            # local dev, against the hosted Supabase project — no local DB, no Docker
pnpm build          # production build — must pass before ending a phase
pnpm lint           # must pass
pnpm typecheck      # tsc --noEmit — must pass
pnpm db:push        # apply new supabase/migrations/*.sql directly to the hosted project
pnpm db:types       # regenerate lib/supabase/database.types.ts from the hosted project's schema
```

---

## 13. Environment variables (`.env.example`)

```
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server only
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=              # server only
RAZORPAY_WEBHOOK_SECRET=          # server only
RESEND_API_KEY=                   # server only
EMAIL_FROM=
SENTRY_DSN=
```

---

## 14. Definition of done (every phase)

- [ ] `pnpm build`, `pnpm lint`, `pnpm typecheck` all pass
- [ ] Works at 360px and 1280px; no horizontal scroll
- [ ] Keyboard navigable; images have alt text
- [ ] No secrets in client bundles; RLS covers any new table
- [ ] Short summary written: what changed, which files, what to test manually
