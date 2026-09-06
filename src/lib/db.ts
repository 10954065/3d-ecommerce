import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { cache } from "react";
import { getTenantId } from "@/lib/tenant/context";
import { tenantScoped } from "@/lib/db/tenant-client";

// Cache key includes a schema-version tag so a Prisma schema migration (which
// regenerates the client's field/type definitions) invalidates the dev-mode
// singleton below instead of silently reusing a client instance created from
// the pre-migration generated code — a long-running `next dev` process
// otherwise never re-evaluates this module-level singleton after HMR.
const globalForPrisma = globalThis as unknown as {
  prisma__guestCheckoutSchema: PrismaClient | undefined;
};

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

/**
 * The raw, tenant-**unaware** Prisma client. Safe to import directly ONLY
 * for the platform-global models that have no `tenantId` column at all —
 * User, Account, Session, VerificationToken, CustomerBodyProfile, Tenant
 * (see the GLOBAL_MODELS set in `src/lib/db/tenant-client.ts`). Querying any
 * other (tenant-scoped) model through `prismaUnsafe` silently skips tenant
 * isolation — use `getTenantDb()` below for those. `src/lib/tenant/resolve.ts`
 * is the one place that legitimately reads TenantDomain across all tenants
 * (resolving a tenant can't depend on one already being known); `prisma/seed.ts`
 * and `prisma/scripts/*` construct their own client and are unaffected either
 * way. See docs/MULTI_TENANCY.md.
 */
export const prismaUnsafe =
  globalForPrisma.prisma__guestCheckoutSchema ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma__guestCheckoutSchema = prismaUnsafe;
}

/**
 * The tenant-scoped Prisma client for the current request — every query
 * against a tenant-owned model is automatically filtered/stamped with the
 * current tenant's id (see `tenantScoped()`). Wrapped in React's `cache()`
 * so a single request reuses one scoped client instead of re-deriving it
 * (and re-reading `headers()`) on every call.
 */
export const getTenantDb = cache(async () => {
  const tenantId = await getTenantId();
  return tenantScoped(tenantId);
});
