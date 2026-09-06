import "server-only";
import { prisma } from "@/lib/db";
import type { CartWithItems } from "@/lib/cart";
import type { Prisma } from "@/generated/prisma/client";

export interface ShippingResolution {
  amount: number;
  currency: string;
  zoneName: string;
}

/**
 * Resolves the flat shipping rate for a destination country. Seeded data has a
 * "ghana-domestic" zone for GH and an "international" zone covering everything
 * else — any country not explicitly listed in a zone falls back to whichever
 * zone is not the domestic one, matching the product spec ("GHS 30 domestic,
 * GHS 250 for everyone else").
 */
export async function resolveShippingTotal(
  country: string,
  db: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<ShippingResolution> {
  const zones = await db.shippingZone.findMany();
  if (zones.length === 0) {
    throw new Error("No shipping zones are configured.");
  }

  const normalizedCountry = country.toUpperCase();
  const matched = zones.find((zone) => zone.countries.includes(normalizedCountry));
  const fallback = zones.find((zone) => !zone.countries.includes("GH")) ?? zones[0];
  const zone = matched ?? fallback;

  return {
    amount: Number(zone.flatRate),
    currency: zone.currency,
    zoneName: zone.name,
  };
}

export interface CartLineComputation {
  id: string;
  productId: string;
  productVariantId: string;
  productName: string;
  productSlug: string;
  imageUrl: string | null;
  imageAlt: string;
  colorName: string;
  size: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  stockQuantity: number;
}

export interface CartComputation {
  items: CartLineComputation[];
  subtotal: number;
  currency: string;
}

/** Server-side price resolution for a cart's line items — never trust a client-submitted price. */
export function computeCart(cart: CartWithItems): CartComputation {
  const items: CartLineComputation[] = cart.items.map((item) => {
    const unitPrice = Number(item.productVariant.priceOverride ?? item.product.basePrice);
    return {
      id: item.id,
      productId: item.productId,
      productVariantId: item.productVariantId,
      productName: item.product.name,
      productSlug: item.product.slug,
      imageUrl: item.product.media[0]?.url ?? null,
      imageAlt: item.product.media[0]?.altText ?? item.product.name,
      colorName: item.productVariant.color.name,
      size: item.productVariant.size,
      quantity: item.quantity,
      unitPrice,
      lineTotal: unitPrice * item.quantity,
      stockQuantity: item.productVariant.stockQuantity,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const currency = cart.items[0]?.product.currency ?? "GHS";

  return { items, subtotal, currency };
}

/** Generates a human-legible, effectively-unique order number (not a security token). */
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.floor(Math.random() * 36 ** 3)
    .toString(36)
    .toUpperCase()
    .padStart(3, "0");
  return `FRM-${timestamp}-${random}`;
}
