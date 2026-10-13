// Konnect (https://konnect.network) — Tunisian gateway: local cards, e-DINAR, Konnect wallet.
// Endpoints follow the v2 API (init-payment + payment details). Verify field names against the
// current Konnect documentation before going live; responses are parsed defensively.
import { z } from 'zod';
import type { CheckoutRequest, CheckoutSession, PaymentProvider, ProviderPayment } from './provider';

const initResponse = z.object({ payUrl: z.url(), paymentRef: z.string().min(1) });

const detailsResponse = z.object({
  payment: z
    .object({
      status: z.string(),
      amount: z.number().optional(),
      orderId: z.string().optional(),
    })
    .passthrough(),
});

export interface KonnectConfig {
  apiUrl: string;
  apiKey: string;
  walletId: string;
  fetchImpl?: typeof fetch;
}

export function createKonnectProvider(config: KonnectConfig): PaymentProvider {
  const doFetch = config.fetchImpl ?? fetch;
  const base = config.apiUrl.replace(/\/+$/, '');

  async function call(path: string, init: RequestInit): Promise<unknown> {
    const res = await doFetch(`${base}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', 'x-api-key': config.apiKey, ...init.headers },
      signal: AbortSignal.timeout(10_000),
    });
    const body: unknown = await res.json().catch(() => null);
    if (!res.ok) throw new Error(`konnect ${path} failed with ${res.status}`);
    return body;
  }

  return {
    name: 'konnect',
    async createCheckout(req: CheckoutRequest): Promise<CheckoutSession> {
      if (req.currency !== 'TND') throw new Error('Konnect only supports TND');
      const body = await call('/payments/init-payment', {
        method: 'POST',
        body: JSON.stringify({
          receiverWalletId: config.walletId,
          token: 'TND',
          amount: req.amountMillimes,
          type: 'immediate',
          description: req.description,
          acceptedPaymentMethods: ['wallet', 'bank_card', 'e-DINAR'],
          lifespan: 30,
          checkoutForm: false,
          addPaymentFeesToAmount: false,
          email: req.customer.email ?? undefined,
          orderId: req.paymentId,
          webhook: req.webhookUrl,
          successUrl: req.successUrl,
          failUrl: req.failUrl,
          theme: 'dark',
        }),
      });
      const parsed = initResponse.parse(body);
      return { redirectUrl: parsed.payUrl, providerRef: parsed.paymentRef };
    },
    async fetchPayment(providerRef: string): Promise<ProviderPayment> {
      if (!/^[A-Za-z0-9_-]{1,100}$/.test(providerRef)) throw new Error('invalid payment ref');
      const body = await call(`/payments/${providerRef}`, { method: 'GET' });
      const { payment } = detailsResponse.parse(body);
      const status = payment.status === 'completed' ? 'succeeded' : payment.status === 'pending' ? 'pending' : 'failed';
      return { status, amountMillimes: payment.amount ?? null, orderId: payment.orderId ?? null, raw: body };
    },
  };
}
