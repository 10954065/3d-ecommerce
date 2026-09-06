"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getTenantDb } from "@/lib/db";
import { getTenantId } from "@/lib/tenant/context";
import { requireAdminSession, UNAUTHORIZED_ERROR } from "@/lib/admin-guard";
import { slugify } from "@/lib/slugify";
import type { ActionResult } from "./color-actions";

const SIZE_LABELS = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;

const createVariantSchema = z.object({
  colorId: z.string().min(1, "Color is required"),
  size: z.enum(SIZE_LABELS),
  stockQuantity: z.coerce.number().int().min(0),
  lowStockAt: z.coerce.number().int().min(0),
});

export async function createVariantAction(
  productId: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: UNAUTHORIZED_ERROR };

  const parsed = createVariantSchema.safeParse({
    colorId: formData.get("colorId"),
    size: formData.get("size"),
    stockQuantity: formData.get("stockQuantity") || 0,
    lowStockAt: formData.get("lowStockAt") || 5,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid variant." };
  }

  const [db, tenantId] = await Promise.all([getTenantDb(), getTenantId()]);
  const [product, color] = await Promise.all([
    db.product.findUnique({ where: { id: productId }, select: { sku: true } }),
    db.productColor.findUnique({ where: { id: parsed.data.colorId }, select: { name: true } }),
  ]);
  if (!product || !color) {
    return { success: false, error: "Product or color not found." };
  }

  const sku = `${product.sku}-${slugify(color.name)}-${parsed.data.size}`;

  try {
    await db.productVariant.create({
      data: {
        tenantId,
        productId,
        colorId: parsed.data.colorId,
        size: parsed.data.size,
        sku,
        stockQuantity: parsed.data.stockQuantity,
        lowStockAt: parsed.data.lowStockAt,
      },
    });
  } catch (error) {
    return { success: false, error: describeVariantError(error) };
  }

  revalidatePath(`/admin/products/${productId}`);
  return { success: true };
}

const updateVariantSchema = z.object({
  stockQuantity: z.coerce.number().int().min(0),
  lowStockAt: z.coerce.number().int().min(0),
  isActive: z.coerce.boolean(),
});

export async function updateVariantAction(
  productId: string,
  variantId: string,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: UNAUTHORIZED_ERROR };

  const parsed = updateVariantSchema.safeParse({
    stockQuantity: formData.get("stockQuantity"),
    lowStockAt: formData.get("lowStockAt"),
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid variant." };
  }

  try {
    const db = await getTenantDb();
    await db.productVariant.update({
      where: { id: variantId },
      data: parsed.data,
    });
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not update variant." };
  }

  revalidatePath(`/admin/products/${productId}`);
  return { success: true };
}

export async function deleteVariantAction(productId: string, variantId: string): Promise<ActionResult> {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: UNAUTHORIZED_ERROR };

  try {
    const db = await getTenantDb();
    await db.productVariant.delete({ where: { id: variantId } });
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not delete variant." };
  }

  revalidatePath(`/admin/products/${productId}`);
  return { success: true };
}

function describeVariantError(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2002") {
    return "That color/size combination already exists for this product.";
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}
