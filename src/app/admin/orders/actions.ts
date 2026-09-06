"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getTenantDb } from "@/lib/db";
import { requireAdminSession, UNAUTHORIZED_ERROR } from "@/lib/admin-guard";

const ORDER_STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"] as const;

const statusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export interface ActionResult {
  success: boolean;
  error?: string;
}

export async function updateOrderStatusAction(
  orderId: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  // Defense in depth: src/proxy.ts already gates /admin/*, but this Server
  // Action must independently verify the caller's role since actions can be
  // invoked directly.
  const session = await requireAdminSession();
  if (!session) return { success: false, error: UNAUTHORIZED_ERROR };

  const parsed = statusSchema.safeParse({ status: formData.get("status") });
  if (!parsed.success) {
    return { success: false, error: "Invalid order status." };
  }

  try {
    const db = await getTenantDb();
    await db.order.update({
      where: { id: orderId },
      data: { status: parsed.data.status },
    });
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not update order status." };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
  return { success: true };
}
