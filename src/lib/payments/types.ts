export type PaymentStatus = "pending" | "paid" | "failed";

export interface InitiatePaymentParams {
  orderId: string;
  orderNumber: string;
  /** Amount in the smallest currency unit is provider-specific; each provider converts internally. */
  amount: number;
  currency: string;
  customerEmail: string;
  returnUrl: string;
}

export interface InitiatePaymentResult {
  providerRef: string;
  /** Where to send the browser to complete payment (hosted checkout / redirect flow). */
  redirectUrl: string;
}

export interface VerifyPaymentResult {
  status: PaymentStatus;
  amount: number;
  currency: string;
}

export interface PaymentProvider {
  readonly name: string;
  initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult>;
  verify(providerRef: string): Promise<VerifyPaymentResult>;
}
