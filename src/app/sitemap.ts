import type { MetadataRoute } from "next";
import { getTenantDb } from "@/lib/db";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Per-tenant sitemap content requires reading the resolved tenant from
// request headers (see src/proxy.ts) — that makes this route dynamic rather
// than statically generated once at build time.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = await getTenantDb();
  const [products, collections] = await Promise.all([
    db.product.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    }),
    db.collection.findMany({ select: { slug: true } }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/men`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/women`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/collections`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/studio`, changeFrequency: "monthly", priority: 0.6 },
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${BASE_URL}/products/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const collectionRoutes: MetadataRoute.Sitemap = collections.map((collection) => ({
    url: `${BASE_URL}/collections/${collection.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...productRoutes, ...collectionRoutes];
}
