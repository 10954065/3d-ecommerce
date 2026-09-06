"use server";

import { requireAdminSession } from "@/lib/admin-guard";
import { getGarmentPreviewProps } from "@/lib/queries/admin-3d-studio";

export async function getGarmentPreviewAction(productId: string) {
  const session = await requireAdminSession();
  if (!session) return null;
  return getGarmentPreviewProps(productId);
}
