import "server-only";
import { prisma } from "@/lib/db";
import type { Gender } from "@/generated/prisma/client";

export const PRODUCTS_PAGE_SIZE = 20;

interface ListProductsParams {
  search?: string;
  page?: number;
}

export async function listProducts({ search, page = 1 }: ListProductsParams) {
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { sku: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        status: true,
        basePrice: true,
        currency: true,
        brand: { select: { name: true } },
        category: { select: { name: true } },
        media: {
          where: { type: "IMAGE" },
          orderBy: { sortOrder: "asc" },
          take: 1,
          select: { url: true, altText: true },
        },
        variants: { select: { stockQuantity: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PRODUCTS_PAGE_SIZE,
      take: PRODUCTS_PAGE_SIZE,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      basePrice: Number(p.basePrice),
      currency: p.currency,
      brandName: p.brand.name,
      categoryName: p.category.name,
      thumbnail: p.media[0] ?? null,
      totalStock: p.variants.reduce((sum, v) => sum + v.stockQuantity, 0),
    })),
    total,
    page,
    pageSize: PRODUCTS_PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / PRODUCTS_PAGE_SIZE)),
  };
}

export async function getProductForEdit(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      brand: true,
      category: true,
      colors: { orderBy: { name: "asc" } },
      variants: { include: { color: true }, orderBy: [{ colorId: "asc" }, { size: "asc" }] },
      media: { orderBy: { sortOrder: "asc" } },
      garmentAsset: {
        include: {
          fabricMaterial: true,
          garmentSizes: { include: { mannequin: true } },
        },
      },
    },
  });
}

export async function getBrands() {
  return prisma.brand.findMany({ orderBy: { name: "asc" } });
}

export async function getCategoriesForGender(gender: Gender) {
  return prisma.category.findMany({ where: { gender }, orderBy: { name: "asc" } });
}

export async function getAllCategories() {
  return prisma.category.findMany({ orderBy: [{ gender: "asc" }, { name: "asc" }] });
}

export async function getFabricMaterials() {
  return prisma.fabricMaterial.findMany({ orderBy: { name: "asc" } });
}

export async function getMannequinsForGender(gender: Gender) {
  return prisma.mannequin.findMany({ where: { gender, isActive: true } });
}
