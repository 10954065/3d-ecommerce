import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Cache key includes a schema-version tag so a Prisma schema migration (which
// regenerates the client's field/type definitions) invalidates the dev-mode
// singleton below instead of silently reusing a client instance created from
// the pre-migration generated code — a long-running `next dev` process
// otherwise never re-evaluates this module-level singleton after HMR.
const globalForPrisma = globalThis as unknown as {
  prisma__guestCheckoutSchema: PrismaClient | undefined;
};

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma =
  globalForPrisma.prisma__guestCheckoutSchema ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma__guestCheckoutSchema = prisma;
}
