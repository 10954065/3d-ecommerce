// One-time-per-environment backfill: stamps the default tenant's id onto any
// row left over from before tenancy existed, and gives every user without a
// membership a TenantMembership in the default tenant. Idempotent — safe to
// re-run. See docs/MULTI_TENANCY.md (Step 3) for the migration this supports.
import "dotenv/config";
import { PrismaClient, type UserRole, type TenantRole } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEFAULT_TENANT_SLUG = "forme";

// Tenant-scoped models, in dependency order (parents before children isn't
// strictly required for an updateMany by null-check, but keeping this list
// in the same order as schema.prisma makes it easy to audit against it).
const TENANT_SCOPED_MODELS = [
  "brand",
  "category",
  "collection",
  "product",
  "productColor",
  "productVariant",
  "productMedia",
  "mannequin",
  "fabricMaterial",
  "garmentAsset",
  "garmentSize",
  "garmentAnimation",
  "simulationAsset",
  "simulationVariant",
  "cart",
  "cartItem",
  "wishlist",
  "wishlistItem",
  "address",
  "order",
  "orderItem",
  "payment",
  "shippingZone",
  "coupon",
  "review",
  "analyticsEvent",
  "threeDViewEvent",
] as const;

const USER_ROLE_TO_TENANT_ROLE: Record<UserRole, TenantRole> = {
  ADMIN: "TENANT_ADMIN",
  STAFF: "CONTENT_MANAGER",
  CUSTOMER: "CUSTOMER",
};

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { slug: DEFAULT_TENANT_SLUG } });
  if (!tenant) {
    throw new Error(
      `Default tenant "${DEFAULT_TENANT_SLUG}" not found — run \`npm run db:seed\` first.`,
    );
  }

  for (const model of TENANT_SCOPED_MODELS) {
    // Every model here has a nullable `tenantId` column (Step 2 migration).
    const client = prisma[model] as { updateMany: (args: unknown) => Promise<{ count: number }> };
    const { count } = await client.updateMany({
      where: { tenantId: null },
      data: { tenantId: tenant.id },
    });
    if (count > 0) console.log(`  ${model}: backfilled ${count} row(s)`);
  }

  const users = await prisma.user.findMany({ select: { id: true, role: true } });
  let membershipsCreated = 0;
  for (const user of users) {
    const existing = await prisma.tenantMembership.findUnique({
      where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
    });
    if (existing) continue;
    await prisma.tenantMembership.create({
      data: { tenantId: tenant.id, userId: user.id, role: USER_ROLE_TO_TENANT_ROLE[user.role] },
    });
    membershipsCreated++;
  }
  if (membershipsCreated > 0) console.log(`  tenantMembership: created ${membershipsCreated} row(s)`);

  console.log(`Backfill complete against tenant "${tenant.slug}" (${tenant.id}).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
