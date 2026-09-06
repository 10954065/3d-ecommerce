import "server-only";
import { prismaUnsafe } from "@/lib/db";

/**
 * Models with no `tenantId` column — either platform-global identity (User,
 * Account, Session, VerificationToken), user-owned data that intentionally
 * spans tenants (CustomerBodyProfile — "measure once, shop every brand"), or
 * the tenant root itself (Tenant has no tenantId column to filter by).
 *
 * NOTE: TenantDomain and TenantMembership are NOT here — they do carry a
 * `tenantId` column and are tenant-owned data (a tenant's own domains and
 * memberships), so they're scoped like everything else. Only tenant
 * resolution (`src/lib/tenant/resolve.ts`) needs to look across tenants, and
 * it deliberately uses `prismaUnsafe` for that reason.
 */
const GLOBAL_MODELS = new Set([
  "User",
  "Account",
  "Session",
  "VerificationToken",
  "CustomerBodyProfile",
  "Tenant",
]);

/**
 * Wraps the base Prisma client so every query against a tenant-scoped model
 * is automatically filtered/stamped with `tenantId` — callers never need to
 * remember `where: { tenantId }` by hand. Relies on Prisma's "extended where
 * unique" support (a bare `tenantId` field is a valid extra filter on any
 * `<Model>WhereUniqueInput`, verified against the generated client), so
 * find/update/delete-by-id all stay tenant-safe without rewriting operations
 * or breaking interactive-transaction (`$transaction(async (tx) => ...)`)
 * compatibility — everything here still routes through the real `query()`.
 *
 * Not handled (by design — see docs/MULTI_TENANCY.md):
 *  - Nested writes (`order.create({ data: { items: { create: [...] } } })`)
 *    aren't intercepted; nested child rows need `tenantId` set explicitly by
 *    the caller.
 *  - Raw SQL (`$queryRaw`/`$executeRaw`) bypasses this entirely — none exists
 *    in the codebase today; keep it that way or scope it manually.
 */
export function tenantScoped(tenantId: string) {
  return prismaUnsafe.$extends({
    name: "tenant-scope",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!model || GLOBAL_MODELS.has(model)) {
            return query(args);
          }

          const typedArgs = args as {
            where?: Record<string, unknown>;
            data?: unknown;
            create?: unknown;
          };

          switch (operation) {
            case "create":
              return query({
                ...args,
                data: { ...(typedArgs.data as Record<string, unknown>), tenantId },
              });

            case "createMany": {
              const rows = Array.isArray(typedArgs.data) ? typedArgs.data : [typedArgs.data];
              return query({
                ...args,
                data: rows.map((row) => ({ ...(row as Record<string, unknown>), tenantId })),
              });
            }

            case "upsert":
              return query({
                ...args,
                where: { ...(typedArgs.where ?? {}), tenantId },
                create: { ...(typedArgs.create as Record<string, unknown>), tenantId },
              });

            case "findUnique":
            case "findUniqueOrThrow":
            case "findFirst":
            case "findFirstOrThrow":
            case "findMany":
            case "count":
            case "aggregate":
            case "groupBy":
            case "update":
            case "updateMany":
            case "delete":
            case "deleteMany":
              return query({ ...args, where: { ...(typedArgs.where ?? {}), tenantId } });

            default:
              return query(args);
          }
        },
      },
    },
  });
}

export type TenantDb = ReturnType<typeof tenantScoped>;
