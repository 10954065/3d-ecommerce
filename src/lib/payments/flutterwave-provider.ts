import type {
  InitiatePaymentParams,
  InitiatePaymentResult,
  PaymentProvider,
  VerifyPaymentResult,
} from "./types";

const FLW_API = "https://api.flutterwave.com/v3";

export class FlutterwavePaymentProvider implements PaymentProvider {
  readonly name = "flutterwave";
  private secretKey: string;

  constructor() {
    const key = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!key) {
      throw new Error("FLUTTERWAVE_SECRET_KEY is not set — cannot use the flutterwave payment provider.");
    }
    this.secretKey = key;
  }

  async initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    const res = await fetch(`${FLW_API}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: params.orderId,
        amount: params.amount,
        currency: params.currency,
        redirect_url: params.returnUrl,
        customer: { email: params.customerEmail },
        customizations: { title: `Order ${params.orderNumber}` },
      }),
    });

    const json = await res.json();
    if (!res.ok || json.status !== "success") {
      throw new Error(`Flutterwave initiate failed: ${json.message ?? res.statusText}`);
    }

    return { providerRef: params.orderId, redirectUrl: json.data.link };
  }

  async verify(providerRef: string): Promise<VerifyPaymentResult> {
    const res = await fetch(
      `${FLW_API}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(providerRef)}`,
      { headers: { Authorization: `Bearer ${this.secretKey}` } },
    );
    const json = await res.json();
    if (!res.ok || json.status !== "success") {
      throw new Error(`Flutterwave verify failed: ${json.message ?? res.statusText}`);
    }

    const flwStatus = json.data.status as string;
    return {
      status:
        flwStatus === "successful"
          ? "paid"
          : flwStatus === "failed"
            ? "failed"
            : "pending",
      amount: json.data.amount,
      currency: json.data.currency,
    };
  }
}
