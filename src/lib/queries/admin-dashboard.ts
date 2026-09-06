import "server-only";
import { prisma } from "@/lib/db";

const NON_REVENUE_STATUSES = ["CANCELLED", "REFUNDED"] as const;
const LOW_STOCK_LIMIT = 10;
const TOP_PRODUCTS_LIMIT = 5;

export interface DashboardStats {
  revenue: number;
  orderCount: number;
  customerCount: number;
  productCount: number;
  currency: string;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [revenueAgg, orderCount, customerCount, productCount, firstOrder] = await Promise.all([
    prisma.order.aggregate({
      _sum: { grandTotal: true },
      where: { status: { notIn: [...NON_REVENUE_STATUSES] } },
    }),
    prisma.order.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.product.count(),
    prisma.order.findFirst({ select: { currency: true } }),
  ]);

  return {
    revenue: Number(revenueAgg._sum.grandTotal ?? 0),
    orderCount,
    customerCount,
    productCount,
    currency: firstOrder?.currency ?? "GHS",
  };
}

export interface LowStockVariant {
  id: string;
  sku: string;
  stockQuantity: number;
  lowStockAt: number;
  productName: string;
  productId: string;
  colorName: string;
  size: string;
}

/**
 * Prisma cannot compare two columns of the same row in a `where` filter, so
 * low-stock detection (stockQuantity <= lowStockAt) is done in application
 * code. Fine at this catalog's scale — revisit with a raw query if the
 * variant count grows large enough to matter.
 */
export async function getLowStockVariants(limit = LOW_STOCK_LIMIT): Promise<LowStockVariant[]> {
  const variants = await prisma.productVariant.findMany({
    where: { isActive: true },
    select: {
      id: true,
      sku: true,
      stockQuantity: true,
      lowStockAt: true,
      size: true,
      product: { select: { id: true, name: true } },
      color: { select: { name: true } },
    },
  });

  return variants
    .filter((v) => v.stockQuantity <= v.lowStockAt)
    .sort((a, b) => a.stockQuantity - b.stockQuantity)
    .slice(0, limit)
    .map((v) => ({
      id: v.id,
      sku: v.sku,
      stockQuantity: v.stockQuantity,
      lowStockAt: v.lowStockAt,
      productName: v.product.name,
      productId: v.product.id,
      colorName: v.color.name,
      size: v.size,
    }));
}

export interface ProductViewStat {
  productId: string;
  productName: string;
  count: number;
}

export async function getMostViewedProducts(limit = TOP_PRODUCTS_LIMIT): Promise<ProductViewStat[]> {
  const grouped = await prisma.analyticsEvent.groupBy({
    by: ["productId"],
    where: { type: "PRODUCT_VIEW", productId: { not: null } },
    _count: { productId: true },
    orderBy: { _count: { productId: "desc" } },
    take: limit,
  });

  return resolveProductNames(grouped);
}

export async function getMost3DSimulatedProducts(limit = TOP_PRODUCTS_LIMIT): Promise<ProductViewStat[]> {
  const grouped = await prisma.threeDViewEvent.groupBy({
    by: ["productId"],
    _count: { productId: true },
    orderBy: { _count: { productId: "desc" } },
    take: limit,
  });

  return resolveProductNames(
    grouped.map((g) => ({ productId: g.productId as string | null, _count: { productId: g._count.productId } })),
  );
}

async function resolveProductNames(
  grouped: { productId: string | null; _count: { productId: number } }[],
): Promise<ProductViewStat[]> {
  const ids = grouped.map((g) => g.productId).filter((id): id is string => Boolean(id));
  if (ids.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
  const nameById = new Map(products.map((p) => [p.id, p.name]));

  return grouped
    .filter((g) => g.productId && nameById.has(g.productId))
    .map((g) => ({
      productId: g.productId as string,
      productName: nameById.get(g.productId as string) ?? "Unknown product",
      count: g._count.productId,
    }));
}

export interface CategorySales {
  categoryName: string;
  revenue: number;
  unitsSold: number;
}

export async function getSalesByCategory(): Promise<CategorySales[]> {
  const items = await prisma.orderItem.findMany({
    where: { order: { status: { notIn: [...NON_REVENUE_STATUSES] } } },
    select: {
      quantity: true,
      unitPrice: true,
      product: { select: { category: { select: { name: true } } } },
    },
  });

  const byCategory = new Map<string, { revenue: number; unitsSold: number }>();
  for (const item of items) {
    const categoryName = item.product.category.name;
    const existing = byCategory.get(categoryName) ?? { revenue: 0, unitsSold: 0 };
    existing.revenue += Number(item.unitPrice) * item.quantity;
    existing.unitsSold += item.quantity;
    byCategory.set(categoryName, existing);
  }

  return Array.from(byCategory.entries())
    .map(([categoryName, stats]) => ({ categoryName, ...stats }))
    .sort((a, b) => b.revenue - a.revenue);
}
