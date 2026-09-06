import { NextResponse } from "next/server";
import { z } from "zod";
import { getTenantDb } from "@/lib/db";
import { getTenantId } from "@/lib/tenant/context";
import { randomUUID } from "crypto";

const bodySchema = z.object({
  productId: z.string().min(1),
  action: z.string().min(1).max(50),
  sessionId: z.string().optional(),
});

/**
 * Fire-and-forget beacon for high-frequency 3D viewer telemetry (rotate,
 * zoom, animation triggers). Kept as a plain route handler rather than a
 * server action so `fetch(..., { keepalive: true })` from the client works
 * even as the page unloads.
 */
export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  try {
    const [db, tenantId] = await Promise.all([getTenantDb(), getTenantId()]);
    await db.threeDViewEvent.create({
      data: {
        tenantId,
        productId: parsed.data.productId,
        action: parsed.data.action,
        sessionId: parsed.data.sessionId ?? randomUUID(),
      },
    });
  } catch (error) {
    console.error("[3d-event] failed to record event", error);
  }

  return NextResponse.json({ success: true });
}
