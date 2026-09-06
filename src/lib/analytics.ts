import "server-only";
import { getTenantDb } from "@/lib/db";
import { getTenantId } from "@/lib/tenant/context";
import { auth } from "@/auth";
import type { Prisma } from "@/generated/prisma/client";

type AnalyticsEventType =
  | "PRODUCT_VIEW"
  | "THREE_D_VIEW_OPENED"
  | "MANNEQUIN_SELECTED"
  | "SIZE_SELECTED"
  | "COLOR_SELECTED"
  | "SIMULATION_STARTED"
  | "SIMULATION_COMPLETED"
  | "THREE_D_ROTATION"
  | "THREE_D_ZOOM"
  | "FABRIC_VIEWED"
  | "ADD_TO_CART"
  | "CHECKOUT_STARTED"
  | "PURCHASE_COMPLETED";

interface LogAnalyticsEventParams {
  type: AnalyticsEventType;
  productId?: string;
  sessionId?: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Best-effort analytics write. Business flows (cart, checkout) must never fail
 * because telemetry failed — errors are swallowed after logging server-side.
 */
export async function logAnalyticsEvent({
  type,
  productId,
  sessionId,
  metadata,
}: LogAnalyticsEventParams): Promise<void> {
  try {
    const [session, db, tenantId] = await Promise.all([auth(), getTenantDb(), getTenantId()]);
    await db.analyticsEvent.create({
      data: {
        tenantId,
        type,
        productId,
        sessionId,
        userId: session?.user?.id,
        metadata,
      },
    });
  } catch (error) {
    console.error("[analytics] failed to log event", type, error);
  }
}
