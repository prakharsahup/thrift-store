# Le.Jao.Bhai — pre-loved fashion store

An e-commerce site for **Le.Jao.Bhai** (working name), a thrift / pre-loved fashion store selling in India.
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
8. [Signing in locally](#8-signing-in-locally)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Prerequisites

| Tool | Version | Notes |
|---|---|---|
| **Node.js** | 22 LTS recommended (20 works) | Supabase's client warns that Node 20 support is ending. |
| **pnpm** | 12.x | The exact version is pinned in `package.json`. Run `corepack enable` once and Node installs it for you. |
| **Docker Desktop** | any recent | Runs the local Supabase stack (Postgres, Auth, a mail catcher). Must be **running** before you start the database. |
| **Git** | any | |

You do **not** need to install the Supabase CLI — the project runs it through `pnpm dlx`.

## 2. First-time setup

```bash
# 1. Get the code and install dependencies
git clone <this-repo-url> le-jao-bhai-store
cd le-jao-bhai-store
corepack enable          # once per machine: makes the pinned pnpm version available
pnpm install

# 2. Start the local database (Docker Desktop must be running).
#    The first run downloads the Supabase images (a few GB) and takes several minutes.
#    It applies all migrations in supabase/migrations and loads supabase/seed.sql.
pnpm db:start

# 3. Create your local environment file
cp .env.example .env.local
```

Now fill in `.env.local`. Print your local Supabase values with:

```bash
pnpm dlx supabase status -o env
```

and copy them across:

| `.env.local` key | Value from `supabase status` |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` |
| `NEXT_PUBLIC_SUPABASE_URL` | `API_URL` (normally `http://127.0.0.1:54321`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `ANON_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | `SERVICE_ROLE_KEY` — **server-only, never expose it in client code** |

The other keys (Razorpay, Resend, Sentry, Google sign-in) can stay empty for now. The local
Supabase keys are the standard local-development keys and only work against your own machine.

```bash
# 4. Run the site
pnpm dev
```

Open **http://localhost:3000**. You should see the home page with seeded products.

## 3. Running it day to day

1. Start **Docker Desktop**.
2. `pnpm db:start` — starts the local database (fast after the first time; your data is kept).
3. `pnpm dev` — starts the site at http://localhost:3000.
4. When you're done: `pnpm db:stop` (keeps data) and stop `pnpm dev` with Ctrl+C.

Handy local URLs while the database is running:

| URL | What |
|---|---|
| http://localhost:3000 | The site |
| http://127.0.0.1:54323 | **Supabase Studio** — browse tables, run SQL |
| http://127.0.0.1:54324 | **Mailpit** — catches every email the app sends (sign-in codes land here) |
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
| `pnpm db:start` / `pnpm db:stop` | Start / stop local Supabase (Docker) |
| `pnpm db:reset` | Wipe the local database and re-run all migrations + the seed |
| `pnpm db:test` | Database tests (pgTAP): RLS policies, reservations, payments |
| `pnpm db:types` | Regenerate `lib/supabase/database.types.ts` after a schema change |

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
  utils/            money (formatINR — all money is integer paise), cn, slug
supabase/
  migrations/       every schema change, as SQL
  seed.sql          local sample data
  tests/database/   pgTAP tests
  templates/        auth email templates
```

## 7. Database

- **All schema changes are SQL migrations** in `supabase/migrations/`. Never edit the database by
  hand and expect it to stick: add a migration, run `pnpm db:reset`, then `pnpm db:types`.
- **RLS is on for every table.** The public can read published products; users can read and write
  only their own cart, wishlist, addresses and orders; admins (`profiles.role = 'admin'`) can do
  everything.
- **Reservations and payments** go through Postgres functions (`reserve_products`,
  `mark_order_paid`, …) that only the server's service role can call. See `CLAUDE.md` §4 and §9.
- **Money is integer paise** (₹499 = `49900`). Format it only when rendering, with `formatINR()`.
- **Make yourself an admin** (local): sign in once, then in Studio's SQL editor run
  `update profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');`

## 8. Signing in locally

Sign-in is passwordless: enter any email on `/login`, then open **Mailpit**
(http://127.0.0.1:54324) to read the 6-digit code. Locally no real email is sent.

**Google sign-in** is wired up but off. To enable it: create OAuth credentials in Google Cloud, put
them in `supabase/.env` as `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` and
`SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`, set `enabled = true` under `[auth.external.google]` in
`supabase/config.toml`, restart the database (`pnpm db:stop && pnpm db:start`) and set
`NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true` in `.env.local`.

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| `pnpm db:start` fails with a Docker error | Docker Desktop isn't running. Start it, wait until it says it's running, try again. |
| Pages show no products / empty sections | The database isn't running, or `.env.local` is missing or wrong. Check `pnpm dlx supabase status`. |
| A change to `supabase/config.toml` has no effect | Config is read at startup: `pnpm db:stop && pnpm db:start`. |
| `pnpm dev` returns 500 errors with "Jest worker encountered 2 child process exceptions" | The dev server got into a bad state (often after running `pnpm build` alongside it). Stop it and run `pnpm dev` again. |
| Old images still showing after they changed | Hard refresh (Ctrl+Shift+R); next/image caches by file name. |
| "Node.js 20 and below are deprecated" warning | Harmless for now; upgrade to Node 22 when you can. |
| Sign-in code never arrives | Check Mailpit (http://127.0.0.1:54324). Codes expire after an hour. |

---

Contributing: follow `CLAUDE.md` — small conventional commits (`feat:`, `fix:`, `chore:`), no new
dependencies without agreeing first, server components by default, no secrets in client code, and
`pnpm build && pnpm lint && pnpm typecheck && pnpm db:test` passing before you push.
