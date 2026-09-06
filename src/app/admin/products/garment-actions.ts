"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminSession, UNAUTHORIZED_ERROR } from "@/lib/admin-guard";
import type { ActionResult } from "./color-actions";

const ARCHETYPES = ["tshirt", "shirt", "trousers", "jacket", "coat", "dress", "skirt", "jumpsuit"] as const;

const garmentAssetSchema = z.object({
  fabricMaterialId: z.string().min(1, "Fabric is required"),
  archetype: z.enum(ARCHETYPES),
  simulationQuality: z.enum(["PERFORMANCE", "ENHANCED", "CINEMATIC"]),
});

/**
 * Upserts the product's GarmentAsset and, mirroring prisma/seed.ts's
 * seedProduct, ensures a GarmentSize row exists for every Mannequin matching
 * the product's gender for each size the product is currently sold in.
 */
export async function upsertGarmentAssetAction(
  productId: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: UNAUTHORIZED_ERROR };

  const parsed = garmentAssetSchema.safeParse({
    fabricMaterialId: formData.get("fabricMaterialId"),
    archetype: formData.get("archetype"),
    simulationQuality: formData.get("simulationQuality"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid garment asset." };
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { gender: true, variants: { select: { size: true }, distinct: ["size"] } },
  });
  if (!product) {
    return { success: false, error: "Product not found." };
  }

  const baseModelUrl = `procedural:${parsed.data.archetype}`;

  try {
    const garmentAsset = await prisma.garmentAsset.upsert({
      where: { productId },
      update: {
        fabricMaterialId: parsed.data.fabricMaterialId,
        baseModelUrl,
        simulationQuality: parsed.data.simulationQuality,
        status: "READY",
      },
      create: {
        productId,
        fabricMaterialId: parsed.data.fabricMaterialId,
        baseModelUrl,
        simulationQuality: parsed.data.simulationQuality,
        status: "READY",
      },
    });

    const sizes = product.variants.map((v) => v.size);
    if (sizes.length > 0) {
      const mannequins = await prisma.mannequin.findMany({
        where: { gender: product.gender, size: { in: sizes }, isActive: true },
      });

      await prisma.$transaction(
        mannequins.map((mannequin) =>
          prisma.garmentSize.upsert({
            where: {
              garmentAssetId_mannequinId: {
                garmentAssetId: garmentAsset.id,
                mannequinId: mannequin.id,
              },
            },
            update: {},
            create: {
              garmentAssetId: garmentAsset.id,
              mannequinId: mannequin.id,
              morphTargetKey: mannequin.size,
            },
          }),
        ),
      );
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not save garment asset." };
  }

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/3d-studio");
  return { success: true };
}
