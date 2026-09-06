/** Shared slug helper — mirrors prisma/seed.ts's slugify so admin-created
 *  records use the same normalization as seeded data. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
