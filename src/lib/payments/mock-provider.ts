import { getTenantDb } from "@/lib/db";
import type {
  InitiatePaymentParams,
  InitiatePaymentResult,
  PaymentProvider,
  VerifyPaymentResult,
} from "./types";

/**
 * Dev-only payment provider — no real gateway is contacted. It redirects to an
 * in-app "mock checkout" page where a developer explicitly triggers a success
 * or failure, exactly like Stripe/Paystack test mode would. Payment.status in
 * the database is the single source of truth `verify()` reads back from, so
 * the rest of the checkout flow (order confirmation, stock decrement, emails)
 * exercises the exact same code path a real gateway would trigger via webhook.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";

  async initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    const providerRef = `mock_${params.orderId}`;
    return {
      providerRef,
      redirectUrl: `/checkout/pay/mock/${params.orderId}`,
    };
  }

  async verify(providerRef: string): Promise<VerifyPaymentResult> {
    const orderId = providerRef.replace(/^mock_/, "");
    const db = await getTenantDb();
    const payment = await db.payment.findUnique({ where: { orderId } });
    if (!payment) {
      return { status: "pending", amount: 0, currency: "GHS" };
    }
    return {
      status:
        payment.status === "PAID"
          ? "paid"
          : payment.status === "FAILED"
            ? "failed"
            : "pending",
      amount: Number(payment.amount),
      currency: payment.currency,
    };
  }
}
