import "server-only";
import { prisma } from "@/lib/db";
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
  return prisma.product.findMany({
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
  return prisma.product.findMany({
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
  return prisma.category.findMany({
    where: { gender, parentId: null },
    orderBy: { name: "asc" },
  });
}

export async function getColorsForGender(gender: Gender) {
  return prisma.productColor.findMany({
    where: { product: { gender, status: "PUBLISHED" } },
    select: { name: true, hexCode: true },
    distinct: ["name"],
    orderBy: { name: "asc" },
  });
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug, status: "PUBLISHED" },
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
  return prisma.product.findMany({
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
  return prisma.collection.findMany({
    orderBy: [{ isFeatured: "desc" }, { createdAt: "asc" }],
    include: {
      _count: { select: { products: { where: { status: "PUBLISHED" } } } },
    },
  });
}

export async function getProductsByCollection(slug: string) {
  return prisma.collection.findUnique({
    where: { slug },
    include: {
      products: {
        where: { status: "PUBLISHED" },
        select: cardSelect,
        orderBy: { createdAt: "desc" },
      },
    },
  });
}
