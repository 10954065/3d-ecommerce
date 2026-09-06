import { MockPaymentProvider } from "./mock-provider";
import { StripePaymentProvider } from "./stripe-provider";
import { PaystackPaymentProvider } from "./paystack-provider";
import { FlutterwavePaymentProvider } from "./flutterwave-provider";
import type { PaymentProvider } from "./types";

let instance: PaymentProvider | null = null;

/** Single entry point for the checkout flow — business logic never imports a concrete provider. */
export function getPaymentProvider(): PaymentProvider {
  if (instance) return instance;

  const provider = process.env.PAYMENT_PROVIDER ?? "mock";
  switch (provider) {
    case "stripe":
      instance = new StripePaymentProvider();
      break;
    case "paystack":
      instance = new PaystackPaymentProvider();
      break;
    case "flutterwave":
      instance = new FlutterwavePaymentProvider();
      break;
    case "mock":
      instance = new MockPaymentProvider();
      break;
    default:
      throw new Error(`Unknown PAYMENT_PROVIDER "${provider}".`);
  }
  return instance;
}

export * from "./types";
