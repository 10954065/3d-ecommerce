import "server-only";
import { prismaUnsafe } from "@/lib/db";

interface ResolvedTenant {
  tenantId: string;
  slug: string;
}

interface CacheEntry extends ResolvedTenant {
  at: number;
}

const TTL_MS = 60_000;
const cache = new Map<string, CacheEntry>();

/**
 * Resolves a tenant from the request `Host` header via TenantDomain. Cached
 * in-process for TTL_MS since this runs on every request through proxy.ts —
 * swap for a shared cache (Redis) if this ever runs across multiple
 * instances. Uses the raw client deliberately: tenant resolution is what
 * `tenantScoped()` itself depends on, so it can't depend on a tenant already
 * being known.
 */
export async function resolveTenantByHost(host: string): Promise<ResolvedTenant | null> {
  const hit = cache.get(host);
  if (hit && Date.now() - hit.at < TTL_MS) return hit;

  const domain = await prismaUnsafe.tenantDomain.findUnique({
    where: { host },
    select: { tenantId: true, tenant: { select: { slug: true, status: true } } },
  });
  if (!domain || domain.tenant.status !== "ACTIVE") return null;

  const entry: CacheEntry = { tenantId: domain.tenantId, slug: domain.tenant.slug, at: Date.now() };
  cache.set(host, entry);
  return entry;
}
