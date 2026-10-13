/** Payment provider abstraction: Konnect today, Stripe later (requires a foreign entity). */
export interface CheckoutRequest {
  paymentId: string;
  amountMillimes: number;
  currency: string;
  description: string;
  customer: { email: string | null; name?: string | null };
  successUrl: string;
  failUrl: string;
  webhookUrl: string;
}

export interface CheckoutSession {
  redirectUrl: string;
  providerRef: string;
}

export type ProviderPaymentStatus = 'succeeded' | 'pending' | 'failed';

export interface ProviderPayment {
  status: ProviderPaymentStatus;
  amountMillimes: number | null;
  /** Our payment id as echoed back by the provider, when available. */
  orderId: string | null;
  raw: unknown;
}

export interface PaymentProvider {
  readonly name: string;
  createCheckout(req: CheckoutRequest): Promise<CheckoutSession>;
  /** Authoritative status, fetched from the provider (never trust the webhook payload alone). */
  fetchPayment(providerRef: string): Promise<ProviderPayment>;
}
