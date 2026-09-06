import Stripe from "stripe";
import type {
  InitiatePaymentParams,
  InitiatePaymentResult,
  PaymentProvider,
  VerifyPaymentResult,
} from "./types";

export class StripePaymentProvider implements PaymentProvider {
  readonly name = "stripe";
  private client: Stripe;

  constructor() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not set — cannot use the stripe payment provider.");
    }
    this.client = new Stripe(key);
  }

  async initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    const session = await this.client.checkout.sessions.create({
      mode: "payment",
      customer_email: params.customerEmail,
      line_items: [
        {
          price_data: {
            currency: params.currency.toLowerCase(),
            unit_amount: Math.round(params.amount * 100),
            product_data: { name: `Order ${params.orderNumber}` },
          },
          quantity: 1,
        },
      ],
      success_url: `${params.returnUrl}?orderId=${params.orderId}&status=success`,
      cancel_url: `${params.returnUrl}?orderId=${params.orderId}&status=cancelled`,
      metadata: { orderId: params.orderId },
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL.");
    }

    return { providerRef: session.id, redirectUrl: session.url };
  }

  async verify(providerRef: string): Promise<VerifyPaymentResult> {
    const session = await this.client.checkout.sessions.retrieve(providerRef);
    const status: VerifyPaymentResult["status"] =
      session.payment_status === "paid"
        ? "paid"
        : session.status === "expired"
          ? "failed"
          : "pending";

    return {
      status,
      amount: (session.amount_total ?? 0) / 100,
      currency: (session.currency ?? "usd").toUpperCase(),
    };
  }
}
