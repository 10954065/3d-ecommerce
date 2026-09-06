"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getTenantDb } from "@/lib/db";
import { getTenantId } from "@/lib/tenant/context";
import { requireAdminSession, UNAUTHORIZED_ERROR } from "@/lib/admin-guard";

export interface ActionResult {
  success: boolean;
  error?: string;
}

const colorSchema = z.object({
  name: z.string().min(1, "Name is required").max(60),
  hexCode: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Enter a valid hex color, e.g. #1A1A1A"),
});

export async function createColorAction(
  productId: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: UNAUTHORIZED_ERROR };

  const parsed = colorSchema.safeParse({
    name: formData.get("name"),
    hexCode: formData.get("hexCode"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid color." };
  }

  try {
    const [db, tenantId] = await Promise.all([getTenantDb(), getTenantId()]);
    await db.productColor.create({
      data: { tenantId, productId, name: parsed.data.name, hexCode: parsed.data.hexCode },
    });
  } catch (error) {
    return { success: false, error: describeError(error, "A color with that name already exists.") };
  }

  revalidatePath(`/admin/products/${productId}`);
  return { success: true };
}

export async function updateColorAction(
  productId: string,
  colorId: string,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: UNAUTHORIZED_ERROR };

  const parsed = colorSchema.safeParse({
    name: formData.get("name"),
    hexCode: formData.get("hexCode"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid color." };
  }

  try {
    const db = await getTenantDb();
    await db.productColor.update({
      where: { id: colorId },
      data: { name: parsed.data.name, hexCode: parsed.data.hexCode },
    });
  } catch (error) {
    return { success: false, error: describeError(error, "A color with that name already exists.") };
  }

  revalidatePath(`/admin/products/${productId}`);
  return { success: true };
}

export async function deleteColorAction(productId: string, colorId: string): Promise<ActionResult> {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: UNAUTHORIZED_ERROR };

  try {
    // Cascades to ProductVariant rows via the schema's onDelete: Cascade.
    const db = await getTenantDb();
    await db.productColor.delete({ where: { id: colorId } });
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not delete color." };
  }

  revalidatePath(`/admin/products/${productId}`);
  return { success: true };
}

function describeError(error: unknown, uniqueMessage: string): string {
  if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2002") {
    return uniqueMessage;
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}
