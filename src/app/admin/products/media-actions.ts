"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { getTenantDb } from "@/lib/db";
import { getTenantId } from "@/lib/tenant/context";
import { requireAdminSession, UNAUTHORIZED_ERROR } from "@/lib/admin-guard";
import { getStorageProvider, ALLOWED_ASSET_MIME_TYPES, MAX_ASSET_SIZE_BYTES } from "@/lib/storage";
import { slugify } from "@/lib/slugify";
import type { ActionResult } from "./color-actions";

export async function uploadMediaAction(
  productId: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: UNAUTHORIZED_ERROR };

  const file = formData.get("file");
  const colorId = formData.get("colorId");

  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Choose an image to upload." };
  }

  if (!ALLOWED_ASSET_MIME_TYPES.image.includes(file.type as (typeof ALLOWED_ASSET_MIME_TYPES.image)[number])) {
    return { success: false, error: "Unsupported file type. Use PNG, JPEG, WebP, or KTX2." };
  }

  if (file.size > MAX_ASSET_SIZE_BYTES.image) {
    return { success: false, error: "Image is too large (max 15MB)." };
  }

  const extension = file.type.split("/")[1] ?? "bin";
  const key = `products/${productId}/${randomUUID()}-${slugify(file.name.replace(/\.[^.]+$/, ""))}.${extension}`;

  let uploaded: { url: string };
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    uploaded = await getStorageProvider().upload({ key, body: buffer, contentType: file.type });
  } catch (error) {
    console.error("[admin] product media upload failed", error);
    return { success: false, error: "Could not reach storage service. Please try again." };
  }

  const [db, tenantId] = await Promise.all([getTenantDb(), getTenantId()]);
  const maxSortOrder = await db.productMedia.aggregate({
    where: { productId },
    _max: { sortOrder: true },
  });

  try {
    await db.productMedia.create({
      data: {
        tenantId,
        productId,
        type: "IMAGE",
        url: uploaded.url,
        altText: file.name,
        sortOrder: (maxSortOrder._max.sortOrder ?? -1) + 1,
        colorId: typeof colorId === "string" && colorId ? colorId : null,
      },
    });
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not save uploaded image." };
  }

  revalidatePath(`/admin/products/${productId}`);
  return { success: true };
}

export async function deleteMediaAction(productId: string, mediaId: string): Promise<ActionResult> {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: UNAUTHORIZED_ERROR };

  const db = await getTenantDb();
  const media = await db.productMedia.findUnique({ where: { id: mediaId } });
  if (!media || media.productId !== productId) {
    return { success: false, error: "Image not found." };
  }

  const publicBase = process.env.STORAGE_PUBLIC_BASE_URL;
  if (publicBase && media.url.startsWith(`${publicBase}/`)) {
    const key = media.url.slice(publicBase.length + 1);
    try {
      await getStorageProvider().delete(key);
    } catch (error) {
      // Best-effort: an orphaned storage object should never block removing
      // the DB row (and blocking the admin UI over it).
      console.error("[admin] failed to delete storage object", key, error);
    }
  }

  try {
    await db.productMedia.delete({ where: { id: mediaId } });
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not delete image." };
  }

  revalidatePath(`/admin/products/${productId}`);
  return { success: true };
}
