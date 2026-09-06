import type {
  InitiatePaymentParams,
  InitiatePaymentResult,
  PaymentProvider,
  VerifyPaymentResult,
} from "./types";

const PAYSTACK_API = "https://api.paystack.co";

export class PaystackPaymentProvider implements PaymentProvider {
  readonly name = "paystack";
  private secretKey: string;

  constructor() {
    const key = process.env.PAYSTACK_SECRET_KEY;
    if (!key) {
      throw new Error("PAYSTACK_SECRET_KEY is not set — cannot use the paystack payment provider.");
    }
    this.secretKey = key;
  }

  async initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    const res = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: params.customerEmail,
        amount: Math.round(params.amount * 100), // pesewas/kobo
        currency: params.currency,
        reference: params.orderId,
        callback_url: params.returnUrl,
        metadata: { orderId: params.orderId, orderNumber: params.orderNumber },
      }),
    });

    const json = await res.json();
    if (!res.ok || !json.status) {
      throw new Error(`Paystack initialize failed: ${json.message ?? res.statusText}`);
    }

    return {
      providerRef: json.data.reference,
      redirectUrl: json.data.authorization_url,
    };
  }

  async verify(providerRef: string): Promise<VerifyPaymentResult> {
    const res = await fetch(`${PAYSTACK_API}/transaction/verify/${providerRef}`, {
      headers: { Authorization: `Bearer ${this.secretKey}` },
    });
    const json = await res.json();
    if (!res.ok || !json.status) {
      throw new Error(`Paystack verify failed: ${json.message ?? res.statusText}`);
    }

    const paystackStatus = json.data.status as string;
    return {
      status:
        paystackStatus === "success"
          ? "paid"
          : paystackStatus === "failed" || paystackStatus === "abandoned"
            ? "failed"
            : "pending",
      amount: json.data.amount / 100,
      currency: json.data.currency,
    };
  }
}
