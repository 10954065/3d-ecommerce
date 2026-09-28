import "server-only";
import { getTenantDb } from "@/lib/db";
import { parseModelSource } from "@/components/3d/types";

export async function listGarmentAssets() {
  const db = await getTenantDb();
  return db.garmentAsset.findMany({
    include: {
      product: { select: { id: true, name: true, slug: true, gender: true, fit: true, publish3D: true } },
      fabricMaterial: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function listProductsWithGarmentAsset() {
  const db = await getTenantDb();
  return db.product.findMany({
    where: { garmentAsset: { isNot: null } },
    select: { id: true, name: true, gender: true },
    orderBy: { name: "asc" },
  });
}

/** Shapes a product's data into exactly the props <GarmentViewerLoader> needs for a live preview. */
export async function getGarmentPreviewProps(productId: string) {
  const db = await getTenantDb();
  const product = await db.product.findUnique({
    where: { id: productId },
    include: {
      colors: true,
      media: { where: { type: "IMAGE" }, orderBy: { sortOrder: "asc" } },
      garmentAsset: {
        include: {
          fabricMaterial: true,
          garmentSizes: { include: { mannequin: true } },
        },
      },
    },
  });

  if (
    !product ||
    !product.garmentAsset ||
    product.colors.length === 0 ||
    product.garmentAsset.garmentSizes.length === 0
  ) {
    return null;
  }

  const modelSource = parseModelSource(product.garmentAsset.baseModelUrl);
  const fabric = product.garmentAsset.fabricMaterial;

  return {
    productId: product.id,
    productName: product.name,
    archetype: modelSource.kind === "procedural" ? modelSource.archetype : ("tshirt" as const),
    fit: product.fit,
    fabric: {
      massGsm: fabric.massGsm,
      friction: fabric.friction,
      stiffness: fabric.stiffness,
      bendingResistance: fabric.bendingResistance,
      stretchResistance: fabric.stretchResistance,
      damping: fabric.damping,
      elasticity: fabric.elasticity,
      drape: fabric.drape as "low" | "medium" | "high",
    },
    fabricName: fabric.name,
    colors: product.colors.map((c) => ({ id: c.id, name: c.name, hexCode: c.hexCode })),
    sizes: product.garmentAsset.garmentSizes.map((gs) => ({
      size: gs.mannequin.size,
      // UNISEX mannequins default to the female mesh until a dedicated unisex body exists.
      gender: gs.mannequin.gender === "MEN" ? ("male" as const) : ("female" as const),
      measurements: {
        heightCm: gs.mannequin.heightCm,
        chestCm: gs.mannequin.chestCm,
        waistCm: gs.mannequin.waistCm,
        hipsCm: gs.mannequin.hipsCm,
        shoulderWidthCm: gs.mannequin.shoulderWidthCm,
        armLengthCm: gs.mannequin.armLengthCm,
        inseamCm: gs.mannequin.inseamCm,
        neckCm: gs.mannequin.neckCm,
        thighCm: gs.mannequin.thighCm,
      },
    })),
    fallbackImages: product.media.map((m) => ({ url: m.url, alt: m.altText ?? product.name })),
  };
}
