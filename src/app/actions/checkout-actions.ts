"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTenantDb } from "@/lib/db";
import { getTenantId } from "@/lib/tenant/context";
import { getOrCreateCart } from "@/lib/cart";
import { getPaymentProvider } from "@/lib/payments";
import { resolveShippingTotal, generateOrderNumber } from "@/lib/checkout";
import { logAnalyticsEvent } from "@/lib/analytics";

export interface PlaceOrderState {
  error?: string;
}

const placeOrderSchema = z.object({
  savedAddressId: z.string().trim().min(1).max(60).optional(),
  fullName: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().min(1).max(30).optional(),
  line1: z.string().trim().min(1).max(200).optional(),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1).max(100).optional(),
  state: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().max(20).optional(),
  country: z.string().trim().length(2, "Country must be a 2-letter code.").optional(),
  email: z.string().trim().email("Enter a valid email.").optional().or(z.literal("")),
});

function stringOrUndefined(value: FormDataEntryValue | null): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export async function placeOrderAction(
  _prevState: PlaceOrderState,
  formData: FormData,
): Promise<PlaceOrderState> {
  const session = await auth();

  const parsed = placeOrderSchema.safeParse({
    savedAddressId: stringOrUndefined(formData.get("savedAddressId")),
    fullName: stringOrUndefined(formData.get("fullName")),
    phone: stringOrUndefined(formData.get("phone")),
    line1: stringOrUndefined(formData.get("line1")),
    line2: stringOrUndefined(formData.get("line2")),
    city: stringOrUndefined(formData.get("city")),
    state: stringOrUndefined(formData.get("state")),
    postalCode: stringOrUndefined(formData.get("postalCode")),
    country: stringOrUndefined(formData.get("country")),
    email: stringOrUndefined(formData.get("email")) ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the shipping details." };
  }
  const input = parsed.data;

  const customerEmail = session?.user?.email ?? input.email;
  if (!customerEmail) {
    return { error: "An email address is required to place an order." };
  }

  const cart = await getOrCreateCart();
  if (cart.items.length === 0) {
    return { error: "Your cart is empty." };
  }

  const usingSavedAddress = Boolean(input.savedAddressId);
  if (!usingSavedAddress) {
    if (!input.fullName || !input.phone || !input.line1 || !input.city || !input.country) {
      return { error: "Please fill in all required shipping fields." };
    }
  } else if (!session?.user?.id) {
    return { error: "Sign in to use a saved address." };
  }

  const db = await getTenantDb();
  const tenantId = await getTenantId();

  let order: { id: string; orderNumber: string };

  try {
    order = await db.$transaction(async (tx) => {
      let addressId: string;
      let country: string;

      if (input.savedAddressId && session?.user?.id) {
        const saved = await tx.address.findFirst({
          where: { id: input.savedAddressId, userId: session.user.id },
        });
        if (!saved) {
          throw new Error("Selected address could not be found.");
        }
        addressId = saved.id;
        country = saved.country;
      } else {
        const created = await tx.address.create({
          data: {
            tenantId,
            // Omitted (rather than passed as an explicit `null`) for guests —
            // Prisma's generated input validator treats an explicit `userId:
            // null` on a nullable-relation FK as ambiguous between its
            // "checked" (relation-object) and "unchecked" (raw-FK) create
            // input shapes and rejects it; leaving the key out entirely lets
            // the column default to NULL as intended.
            ...(session?.user?.id ? { userId: session.user.id } : {}),
            fullName: input.fullName!,
            phone: input.phone!,
            line1: input.line1!,
            line2: input.line2 || null,
            city: input.city!,
            state: input.state || null,
            postalCode: input.postalCode || null,
            country: input.country!.toUpperCase(),
            isDefault: Boolean(session?.user?.id),
          },
        });
        addressId = created.id;
        country = created.country;
      }

      const shipping = await resolveShippingTotal(country, tx);
      const currency = cart.items[0]?.product.currency ?? "GHS";
      const subtotal = cart.items.reduce((sum, item) => {
        const unitPrice = Number(item.productVariant.priceOverride ?? item.product.basePrice);
        return sum + unitPrice * item.quantity;
      }, 0);
      // No tax/VAT model exists in the current product spec — kept explicit at
      // zero rather than fabricating a rate.
      const taxTotal = 0;
      const grandTotal = subtotal + shipping.amount + taxTotal;

      const createdOrder = await tx.order.create({
        data: {
          tenantId,
          orderNumber: generateOrderNumber(),
          // See the address create above for why this is omitted rather
          // than explicitly `null` for guest orders.
          ...(session?.user?.id ? { userId: session.user.id } : {}),
          guestEmail: session?.user?.id ? null : customerEmail,
          addressId,
          status: "PENDING",
          subtotal,
          shippingTotal: shipping.amount,
          taxTotal,
          discountTotal: 0,
          grandTotal,
          currency,
          items: {
            // Nested creates aren't intercepted by the tenant-scoping
            // extension (it only sees the top-level Order.create) — tenantId
            // must be stamped explicitly here. See docs/MULTI_TENANCY.md.
            create: cart.items.map((item) => ({
              tenantId,
              productId: item.productId,
              productVariantId: item.productVariantId,
              productName: item.product.name,
              variantLabel: `${item.productVariant.color.name} / ${item.productVariant.size}`,
              unitPrice: Number(item.productVariant.priceOverride ?? item.product.basePrice),
              quantity: item.quantity,
            })),
          },
          payment: {
            create: {
              tenantId,
              provider: getPaymentProvider().name,
              status: "PENDING",
              amount: grandTotal,
              currency,
            },
          },
        },
      });

      // Stock is decremented here, at order-placement time, rather than at
      // payment confirmation — this reserves inventory the instant an order
      // commits so two concurrent checkouts cannot both oversell the same
      // unit while a payment is pending. A conditional update (only
      // decrementing when enough stock remains) guards the race between the
      // pre-check above and this write; if it fails, the whole transaction
      // (including the order/address just created) rolls back.
      for (const item of cart.items) {
        const result = await tx.productVariant.updateMany({
          where: { id: item.productVariantId, stockQuantity: { gte: item.quantity } },
          data: { stockQuantity: { decrement: item.quantity } },
        });
        if (result.count === 0) {
          throw new Error(`"${item.product.name}" no longer has enough stock available.`);
        }
      }

      // The cart is cleared once the order is placed (not once payment is
      // confirmed) — the items are already committed to the order snapshot,
      // matching how hosted-checkout providers (Stripe Checkout, etc.) treat
      // "created a checkout session" as the point of no return for the cart.
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return { id: createdOrder.id, orderNumber: createdOrder.orderNumber };
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not place your order. Please try again.",
    };
  }

  const provider = getPaymentProvider();
  const payment = await db.payment.findUniqueOrThrow({ where: { orderId: order.id } });
  const { providerRef, redirectUrl } = await provider.initiate({
    orderId: order.id,
    orderNumber: order.orderNumber,
    amount: Number(payment.amount),
    currency: payment.currency,
    customerEmail,
    returnUrl: `/checkout/confirmation/${order.id}`,
  });

  await db.payment.update({ where: { orderId: order.id }, data: { providerRef } });

  redirect(redirectUrl);
}

type MockOutcome = "success" | "failure";

/**
 * Dev-only: simulates the webhook a real payment gateway would send. Bound to
 * a specific orderId + outcome and invoked directly as a <form action> from
 * the mock payment page — see src/app/checkout/pay/mock/[orderId]/page.tsx.
 */
export async function simulateMockPaymentAction(orderId: string, outcome: MockOutcome): Promise<void> {
  const db = await getTenantDb();
  const payment = await db.payment.findUnique({ where: { orderId } });
  if (!payment) {
    throw new Error("Payment record not found.");
  }
  if (payment.provider !== "mock") {
    throw new Error("This action only applies to mock payments.");
  }
  if (payment.status !== "PENDING") {
    // Already resolved — just route to wherever that resolution leads.
    redirect(payment.status === "PAID" ? `/checkout/confirmation/${orderId}` : `/checkout/failed/${orderId}`);
  }

  if (outcome === "success") {
    await db.$transaction(async (tx) => {
      await tx.payment.update({ where: { orderId }, data: { status: "PAID" } });
      await tx.order.update({ where: { id: orderId }, data: { status: "PROCESSING" } });
    });
    await logAnalyticsEvent({ type: "PURCHASE_COMPLETED" });
    redirect(`/checkout/confirmation/${orderId}`);
  } else {
    await db.$transaction(async (tx) => {
      await tx.payment.update({ where: { orderId }, data: { status: "FAILED" } });
      await tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
    });
    redirect(`/checkout/failed/${orderId}`);
  }
}
