import "server-only";
import { getTenantDb } from "@/lib/db";
import { getTenantId } from "@/lib/tenant/context";
import type { Gender, SizeLabel } from "@/generated/prisma/client";

export type ProductSort = "newest" | "price-asc" | "price-desc";

const cardSelect = {
  id: true,
  name: true,
  slug: true,
  gender: true,
  basePrice: true,
  compareAtPrice: true,
  currency: true,
  brand: { select: { name: true } },
  colors: { select: { id: true, name: true, hexCode: true } },
  variants: { select: { size: true }, distinct: ["size" as const] },
  media: {
    where: { type: "IMAGE" as const },
    orderBy: { sortOrder: "asc" as const },
    take: 1,
    select: { url: true, altText: true },
  },
};

export type ProductCardData = Awaited<ReturnType<typeof getFeaturedProducts>>[number];

export async function getFeaturedProducts(limit = 8) {
  const db = await getTenantDb();
  return db.product.findMany({
    where: { status: "PUBLISHED", collections: { some: { slug: "new-arrivals" } } },
    select: cardSelect,
    take: limit,
    orderBy: { createdAt: "desc" },
  });
}

export async function getProductsByGender(
  gender: Gender,
  filters?: {
    categorySlug?: string;
    sort?: ProductSort;
    size?: SizeLabel;
    color?: string;
  },
) {
  const db = await getTenantDb();
  return db.product.findMany({
    where: {
      status: "PUBLISHED",
      gender,
      ...(filters?.categorySlug ? { category: { slug: filters.categorySlug } } : {}),
      ...(filters?.size ? { variants: { some: { size: filters.size } } } : {}),
      ...(filters?.color ? { colors: { some: { name: filters.color } } } : {}),
    },
    select: cardSelect,
    orderBy:
      filters?.sort === "price-asc"
        ? { basePrice: "asc" }
        : filters?.sort === "price-desc"
          ? { basePrice: "desc" }
          : { createdAt: "desc" },
  });
}

export async function getCategoriesForGender(gender: Gender) {
  const db = await getTenantDb();
  return db.category.findMany({
    where: { gender, parentId: null },
    orderBy: { name: "asc" },
  });
}

export async function getColorsForGender(gender: Gender) {
  const db = await getTenantDb();
  return db.productColor.findMany({
    where: { product: { gender, status: "PUBLISHED" } },
    select: { name: true, hexCode: true },
    distinct: ["name"],
    orderBy: { name: "asc" },
  });
}

export async function getProductBySlug(slug: string) {
  const [db, tenantId] = await Promise.all([getTenantDb(), getTenantId()]);
  return db.product.findUnique({
    where: { tenantId_slug: { tenantId, slug }, status: "PUBLISHED" },
    include: {
      brand: true,
      category: true,
      colors: true,
      variants: { where: { isActive: true }, include: { color: true } },
      media: { orderBy: { sortOrder: "asc" } },
      garmentAsset: {
        include: {
          fabricMaterial: true,
          garmentSizes: { include: { mannequin: true } },
          animations: true,
        },
      },
    },
  });
}

export async function getRelatedProducts(productId: string, categoryId: string, limit = 4) {
  const db = await getTenantDb();
  return db.product.findMany({
    where: {
      status: "PUBLISHED",
      categoryId,
      id: { not: productId },
    },
    select: cardSelect,
    take: limit,
  });
}

export async function getCollections() {
  const db = await getTenantDb();
  return db.collection.findMany({
    orderBy: [{ isFeatured: "desc" }, { createdAt: "asc" }],
    include: {
      _count: { select: { products: { where: { status: "PUBLISHED" } } } },
    },
  });
}

export async function getProductsByCollection(slug: string) {
  const [db, tenantId] = await Promise.all([getTenantDb(), getTenantId()]);
  return db.collection.findUnique({
    where: { tenantId_slug: { tenantId, slug } },
    include: {
      products: {
        where: { status: "PUBLISHED" },
        select: cardSelect,
        orderBy: { createdAt: "desc" },
      },
    },
  });
}
