# Baaki.store — pre-loved fashion store

An e-commerce site for **Baaki.store** (working name), a thrift / pre-loved fashion store selling in India.
Every product is a single, unique item — one of one — with a condition grade, flat measurements and
honest flaw notes.

Built with Next.js (App Router), TypeScript, Tailwind CSS v4, Supabase (Postgres, Auth) and GSAP.
Payments (Razorpay) are being added next.

> **Read before writing code:** [`CLAUDE.md`](CLAUDE.md) is the project spec (rules, data model,
> phases, conventions) and [`MOTION.md`](MOTION.md) is the animation spec. Both apply to everyone.

---

## Contents

1. [Prerequisites](#1-prerequisites)
2. [First-time setup](#2-first-time-setup)
3. [Running it day to day](#3-running-it-day-to-day)
4. [Scripts](#4-scripts)
5. [What's built so far](#5-whats-built-so-far)
6. [Project structure](#6-project-structure)
7. [Database](#7-database)
8. [Signing in](#8-signing-in)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Prerequisites

| Tool | Version | Notes |
|---|---|---|
| **Node.js** | 22 LTS recommended (20 works) | Supabase's client warns that Node 20 support is ending. |
| **pnpm** | 12.x | The exact version is pinned in `package.json`. Run `corepack enable` once and Node installs it for you. |
| **Git** | any | |

No Docker, no local database. The app and everyone on it talk to one hosted Supabase project
("xyz-thrift", `ap-south-1`) — the full database, auth, and storage all live there, dev and prod
alike. You do **not** need to install the Supabase CLI — the project runs it through `pnpm dlx`.

## 2. First-time setup

```bash
# 1. Get the code and install dependencies
git clone <this-repo-url> le-jao-bhai-store
cd le-jao-bhai-store
corepack enable          # once per machine: makes the pinned pnpm version available
pnpm install

# 2. Create your environment file
cp .env.example .env.local
```

Fill in `.env.local` with the hosted project's values (ask the project owner, or find them in the
[Supabase dashboard](https://supabase.com/dashboard) under Project Settings → API):

| `.env.local` key | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` |
| `NEXT_PUBLIC_SUPABASE_URL` | the project's API URL (`https://<ref>.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the project's anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | the project's service role key — **server-only, never expose it in client code** |

These point everyone at the same real data, so be careful: there's no local sandbox to break
instead. The other keys (Razorpay, Resend, Sentry, Google sign-in) can stay empty for now.

```bash
# 3. Run the site
pnpm dev
```

Open **http://localhost:3000**. You should see the home page with live products.

## 3. Running it day to day

1. `pnpm dev` — starts the site at http://localhost:3000, talking directly to the hosted database.
2. Stop it with Ctrl+C when you're done. There's nothing else to start or stop.

Handy URLs:

| URL | What |
|---|---|
| http://localhost:3000 | The site |
| https://supabase.com/dashboard/project/mvzslooxqtcudvzdbtkh | **Supabase Studio** — browse tables, run SQL, read logs |
| http://localhost:3000/dev/tokens | Design tokens preview (dev only) |
| http://localhost:3000/dev/motion | Motion playground with a live tuning panel (dev only) |

## 4. Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Local dev server |
| `pnpm build` | Production build — **must pass before a phase is finished** |
| `pnpm start` | Serve the production build |
| `pnpm lint` | ESLint — must pass |
| `pnpm typecheck` | `tsc --noEmit` (strict) — must pass |
| `pnpm format` / `pnpm format:check` | Prettier |
| `pnpm db:link` | One-time per machine: link the Supabase CLI to the hosted project |
| `pnpm db:push` | Apply any new `supabase/migrations/*.sql` files directly to the hosted project |
| `pnpm db:types` | Regenerate `lib/supabase/database.types.ts` from the hosted project's live schema |

## 5. What's built so far

The project is built in phases (see `CLAUDE.md` §10 for the spec; the motion work from `MOTION.md`
is interleaved). Each phase ends with build, lint, typecheck and database tests passing.

| Phase | Status | What it covers |
|---|---|---|
| 0 Setup | ✅ | Next.js, TypeScript, Tailwind v4 tokens, fonts, Supabase clients, motion foundation |
| 1 Layout shell | ✅ | Announcement bar, sticky header + mega-menu, mobile menu + bottom nav, footer, 404 |
| 2 Motion library | ✅ | Smooth scroll, text/image reveals, parallax, masked video, stacking cards, page transitions, marquees |
| 3 Data & seed | ✅ | Schema, RLS on every table, reservation + payment functions, cron, ~40 seeded products, DB tests |
| 4 Brand pages | ✅ | Home, About, Lookbook with full motion |
| 5 Catalogue | ✅ | Gender landings, category listings with URL filters, product pages, search + instant results |
| 6 Cart & sign-in | ✅ | Cart drawer, guest cart (localStorage) merged into the account on sign-in, email-code sign-in, wishlist, account page |
| 7 Checkout & payments | ⏳ next | Addresses, 15-minute reservation, Razorpay (test mode), verify route, webhook, race test |
| 8 Admin | — | Product CRUD with image upload, orders, drops, banners, coupons, dashboard |
| 9 Drops & notifications | — | Drop pages with countdowns, notify-me, back-in-stock emails |
| 10 SEO & performance | — | Metadata, OG images, JSON-LD, sitemap, Lighthouse ≥ 90 |
| 11 Launch prep | — | Sentry, analytics, legal pages, live keys, domain |

**Placeholders to replace before launch:** the brand name (`lib/config/site.ts`), fonts
(`app/layout.tsx`), shipping rule (`lib/config/shipping.ts`), all product/banner imagery
(`public/placeholders`, `supabase/seed.sql`), and the About page copy.

## 6. Project structure

```
app/
  (brand)/          Home, About, Lookbook — full motion (smooth scroll, page transitions)
  (store)/          Shopping pages — light motion only
    [gender]/         /men, /women, /unisex landings
    c/[slug]/         category listing (filters live in the URL)
    p/[slug]/         product page
    search/  cart/  login/  account/
  api/search/       instant search results for the header
  auth/callback/    OAuth (Google) return URL
  dev/              design-token and motion playgrounds (404 in production)
  globals.css       design tokens (@theme) — the only place colours, type sizes and radii live
components/
  layout/  home/  catalogue/  product/  cart/  auth/  motion/  ui/
lib/
  actions/          server actions (cart, wishlist, profile)
  server/           server-only code (catalogue queries, auth helpers)
  supabase/         browser / server / admin clients + generated types
  stores/           zustand stores (cart, wishlist)
  config/           site, navigation, shipping, conditions, home content
  catalogue/        URL filter parsing (shared by server and client)
  motion/           GSAP setup, motion tokens
  validators/       zod schemas (shared by client and server)
  utils/            money (formatMoney — all money is an integer smallest-unit amount), cn, slug
supabase/
  migrations/       every schema change, as SQL
  seed.sql          local sample data
  tests/database/   pgTAP tests
  templates/        auth email templates
```

## 7. Database

- **All schema changes are SQL migrations** in `supabase/migrations/`. Never edit the database by
  hand and expect it to stick: add a migration, run `pnpm db:push`, then `pnpm db:types`. There's
  only the one hosted database, so a bad migration is a production incident, not a reset away —
  review it carefully before pushing.
- **RLS is on for every table.** The public can read published products; users can read and write
  only their own cart, wishlist, addresses and orders; admins (`profiles.role = 'admin'`) can do
  everything.
- **Reservations and payments** go through Postgres functions (`reserve_products`,
  `mark_order_paid`, …) that only the server's service role can call. See `CLAUDE.md` §4 and §9.
- **Money is an integer smallest-unit amount** ($499 = `49900` cents). Format it only when rendering, with `formatMoney()`.
- **Make yourself an admin**: sign in once, then in the Supabase dashboard's SQL editor run
  `update profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');`
- No automated database tests run anymore (the previous pgTAP suite in `supabase/tests/database/`
  needed a local Docker Postgres and is currently unused — see `supabase/tests/database/` if you
  want to revive it against a Supabase branch or similar).

## 8. Signing in

Sign-in is passwordless: enter any email or phone number on `/login` and a real code is sent
(email via whatever's configured in the hosted project's Auth settings; SMS via the provider
configured there under Authentication → Providers → Phone). There's no mail catcher — codes go to
the real inbox/phone.

**Google sign-in** is wired up and controlled by `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED` in `.env.local`;
the OAuth credentials themselves live in the hosted project's Dashboard under
Authentication → Providers → Google, not in this repo.

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| Pages show no products / empty sections | `.env.local` is missing or points at the wrong project. Check `NEXT_PUBLIC_SUPABASE_URL` against the Supabase dashboard. |
| `pnpm dev` returns 500 errors with "Jest worker encountered 2 child process exceptions" | The dev server got into a bad state (often after running `pnpm build` alongside it). Stop it and run `pnpm dev` again. |
| Old images still showing after they changed | Hard refresh (Ctrl+Shift+R); next/image caches by file name. |
| "Node.js 20 and below are deprecated" warning | Harmless for now; upgrade to Node 22 when you can. |
| Sign-in code never arrives | Check the hosted project's Auth logs in the Supabase dashboard; confirm the email/SMS provider there is actually configured. |
| `pnpm db:push` / `pnpm db:types` fails to authenticate | Run `pnpm db:link` once per machine (needs `supabase login` or a `SUPABASE_ACCESS_TOKEN`). |

---

Contributing: follow `CLAUDE.md` — small conventional commits (`feat:`, `fix:`, `chore:`), no new
dependencies without agreeing first, server components by default, no secrets in client code, and
`pnpm build && pnpm lint && pnpm typecheck` passing before you push.
