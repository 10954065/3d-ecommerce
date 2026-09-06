# Multi-tenancy architecture

Forme is pivoting from a single-tenant storefront to a multi-tenant platform
(the "Fashion OS" layer of the wider master spec). This document describes
what's built, how tenant isolation is enforced, and what's intentionally
deferred.

## Status

**Done:**
- `Tenant`, `TenantDomain`, `TenantMembership` models; `tenantId` on all 27
  tenant-owned models; composite unique constraints (`tenantId_slug`,
  `tenantId_sku`, etc.) replacing what were previously platform-global
  uniques.
- Host-based tenant resolution in `src/proxy.ts`, cached in-process
  (`src/lib/tenant/resolve.ts`), stamped onto request headers and read via
  `src/lib/tenant/context.ts`'s `getTenantId()`.
- A Prisma client extension (`src/lib/db/tenant-client.ts`) that
  automatically merges `tenantId` into `where` for every read/update/delete
  against a tenant-owned model, using Prisma's "extended where unique"
  support — no findUnique→findFirst rewriting needed, and it stays
  transaction-safe (`$transaction(async (tx) => ...)`) because every branch
  still calls through the real `query()`.
- Every application call site migrated off the raw `prisma` export to
  `getTenantDb()` (or `prismaUnsafe` for the handful of genuinely
  platform-global models).
- `prisma/seed.ts` and `prisma/scripts/backfill-tenant.ts` seed/backfill a
  default `forme` tenant with `localhost:3000`/`localhost:3001` domains.

**Deferred (see "Non-goals" below):** billing, white-label theming, public
API/webhooks/SDK, Shopify/WooCommerce, SSO/full RBAC, monorepo split, storage
key tenant-prefixing, Postgres RLS.

## Tenant model

- `Tenant` — the root entity. No `tenantId` column (nothing to scope it by).
- `TenantDomain` — one row per host (`forme.localhost:3000`, a subdomain, or
  a custom domain) resolving to a tenant. `resolveTenantByHost()` is the only
  place allowed to query this without a tenant already established, since
  resolving a tenant can't depend on one being known yet.
- `TenantMembership` — join table between `User` and `Tenant`, carrying a
  `TenantRole`. A user can belong to multiple tenants (or none, if they've
  only ever guest-checked-out).

`User`/`Account`/`Session`/`VerificationToken` are deliberately **not**
tenant-scoped — identity is global, one email/password works across every
tenant on the platform. `CustomerBodyProfile` is also global by design:
body measurements are user-owned and apply "measure once, shop every brand."

Because identity is global but a `Cart`/`Wishlist` is now one-per-tenant,
`User.cart`/`User.wishlist` became `User.carts`/`User.wishlists` (arrays) —
a real one-to-many relation now, not a one-to-one.

## Enforcement

`getTenantDb()` (`src/lib/db.ts`) returns a Prisma client wrapped by
`tenantScoped()` for the current request's tenant. The wrapping is a
`$allOperations` query-hook that:

- injects `tenantId` into `data` for `create`/`createMany`/`upsert.create`
- merges `tenantId` into `where` for every find/update/delete/aggregate op

**What this does NOT catch, by design:**
- **Nested writes.** `order.create({ data: { items: { create: [...] } } })`
  only has its top-level `Order.tenantId` injected — the nested `OrderItem`/
  `Payment` rows need `tenantId` set explicitly by the caller. Grep for
  `tenantId,` inside a `create:` block if you add a new nested write.
- **Raw SQL.** No `$queryRaw`/`$executeRaw` exists in the codebase today —
  keep it that way, or scope it manually if one is ever added.
- **The TypeScript layer.** A client extension changes runtime behavior, not
  the generated types — `create`/`upsert` calls still require `tenantId` in
  their `data` at the call site to typecheck, even though the extension also
  injects it at runtime. This is intentional redundancy (belt-and-suspenders),
  not a bug: if you see "Property 'tenantId' is missing," add it to the call
  site rather than trying to make the extension "cover" it.

Array-form `$transaction([...])` is avoided anywhere the app used to use it
(converted to the interactive `$transaction(async (tx) => ...)` form)
because client-extension-wrapped queries can lose the `PrismaPromise`
batching contract the array form depends on.

## Auth

Sessions/JWTs still carry the pre-tenancy `role` (`CUSTOMER`/`ADMIN`/`STAFF`)
— full tenant-aware auth (session carrying `tenantId` + `TenantRole`,
sign-in resolving membership by host, the 7-role `TenantRole` enum actually
being checked) is **not yet wired up**. `TenantMembership` rows exist and are
created on sign-up/seed, but nothing reads them for authorization yet — that
migration plan step is still open. Until then, `role`/`UserRole` remains the
live authorization mechanism (`src/proxy.ts`, `src/lib/admin-guard.ts`), kept
as a "deprecated but load-bearing" field.

## Known consequence: everything is dynamic now

Tenant resolution reads `headers()`, which forces every page that calls
`getTenantDb()`/`getTenantId()` (directly or transitively) into dynamic
(server-rendered per-request) mode — confirmed by `next build`: every route
list as `ƒ` (dynamic), including ones that were previously static
(`sitemap.xml`, content pages). This is the expected cost of per-host
content and hasn't been optimized (e.g., per-tenant ISR/ on-demand
revalidation) yet.

## Non-goals for this pass

Each of these depends on tenancy actually existing, so building them now
would mean rework:

- Billing/subscriptions/plan limits/usage metering.
- White-label theming, per-tenant branding/settings.
- Public API, API keys, webhooks, SDK, embeddable viewer.
- Shopify/WooCommerce connectors.
- SSO/SAML/OIDC.
- Storage object key tenant-prefixing (`tenants/{tenantId}/...`) — the
  `StorageProvider` interface is untouched; objects aren't namespaced yet.
- Postgres RLS as defense-in-depth behind the Prisma extension.
- The `apps/`+`packages/` monorepo split — deferred until a second consumer
  (a studio app, a public API) actually needs a shared package; premature
  before that.
