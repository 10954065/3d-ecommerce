import "server-only";
import { cache } from "react";
import { headers } from "next/headers";

export const TENANT_HEADER = "x-tenant-id";

/**
 * Reads the tenant id that src/proxy.ts resolved and stamped onto the
 * request. Wrapped in React's `cache()` so one request shares a single
 * lookup. Throws rather than defaulting to a tenant — a request that
 * reaches here without the header means it bypassed proxy.ts (e.g. a route
 * outside its matcher), which should fail loudly, not silently serve
 * whichever tenant happens to be first.
 */
export const getTenantId = cache(async (): Promise<string> => {
  const headerList = await headers();
  const tenantId = headerList.get(TENANT_HEADER);
  if (!tenantId) {
    throw new Error(
      "Tenant context missing — this request did not pass through src/proxy.ts's tenant resolution.",
    );
  }
  return tenantId;
});
