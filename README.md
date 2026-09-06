# Forme — 3D Fashion Platform

A production-grade fashion e-commerce platform where every garment is shown
on standardized, measured 3D mannequins with real fabric behavior — not
static photography. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for
the technical rationale behind the 3D/simulation architecture.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4 ·
shadcn/ui on Base UI · Prisma 7 + PostgreSQL · Auth.js v5 · Three.js /
React Three Fiber / drei · S3-compatible object storage (MinIO locally) ·
a provider-agnostic payments layer (mock / Stripe / Paystack / Flutterwave).

## Prerequisites

- Node.js 24+
- Docker (for local Postgres + MinIO)

## Setup

```bash
npm install
cp .env.example .env          # generate a real AUTH_SECRET: openssl rand -base64 32
npm run docker:up             # starts Postgres (5442) + MinIO (9020/9021)
npm run db:migrate            # applies the schema
npm run db:seed               # 20 demo products, mannequins, fabrics, demo users
npm run dev
```

The app runs at whatever port Next picks (3000, or the next free port if
3000 is taken — check the terminal output). If you change the port, update
`AUTH_URL` and `NEXT_PUBLIC_APP_URL` in `.env` to match, or sign-in redirects
will misfire.

### Demo accounts (seeded)

| Role     | Email               | Password     |
|----------|---------------------|--------------|
| Admin    | admin@forme.test    | Admin123!    |
| Customer | customer@forme.test | Customer123! |

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm run start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` / `test:watch` | Vitest |
| `npm run docker:up` / `docker:down` | Local Postgres + MinIO |
| `npm run db:migrate` / `db:generate` / `db:seed` / `db:studio` | Prisma workflows |

## What's real vs. architected-for-later

Everything in this app **runs for real** against Postgres — cart, checkout,
orders, payments (mock provider by default; Stripe/Paystack/Flutterwave work
once you set their secret keys), auth, and the admin CRUD. Nothing is a
fake/mocked UI shell.

The one deliberate simplification: there is no real garment 3D asset
pipeline (CLO3D/Marvelous Designer/Houdini output) to consume, because none
exists yet for this catalog. The 3D viewer instead procedurally generates
mannequins and garments from body measurements and fabric physics — see
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for exactly what's real-time
simulation vs. what's a documented stand-in, and how to plug in real GLB
assets and baked simulation sequences later without changing the viewer's
public API.

## Project structure

```
prisma/                   Schema, migrations, seed data
src/app/                  Routes (App Router) — storefront, /admin, /api
src/components/3d/        The 3D engine (procedural body/garment generation,
                           materials, camera/lighting rigs, animation)
src/components/{admin,auth,cart,catalog,checkout,layout,product}/
                           Feature UI, one folder per surface
src/lib/                  db, cart, payments, storage, analytics, queries
docs/ARCHITECTURE.md      Technical deep-dive
```

## A note on the UI library

shadcn/ui here is configured on **Base UI** (`@base-ui/react`), not Radix.
There is no `asChild` prop — compose primitives with `render`:
`<Button render={<Link href="/x" />}>Text</Button>`.
