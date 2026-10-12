import { describe, expect, it } from 'vitest';
import { createKonnectProvider } from '../src/server/payments/konnect';
import type { PaymentProvider, ProviderPayment } from '../src/server/payments/provider';
import { type PaymentsRepo, handlePaymentNotification, startCheckout } from '../src/server/payments/service';

function memoryRepo() {
  const payments = new Map<string, { id: string; status: string; amount_millimes: number; provider_ref: string | null; applied: number }>();
  const repo: PaymentsRepo = {
    getPlan: async (code) => (code === 'monthly' ? { id: 'plan-1', code, price_millimes: 12000, currency: 'TND', name: { fr: 'Mensuel' } } : null),
    createPendingPayment: async ({ amountMillimes }) => {
      const id = `pay-${payments.size + 1}`;
      payments.set(id, { id, status: 'pending', amount_millimes: amountMillimes, provider_ref: null, applied: 0 });
      return id;
    },
    setProviderRef: async (id, ref) => void (payments.get(id)!.provider_ref = ref),
    findByProviderRef: async (_p, ref) => [...payments.values()].find((p) => p.provider_ref === ref) ?? null,
    markFailed: async (id) => void (payments.get(id)!.status = 'failed'),
    applySuccess: async (id) => {
      const p = payments.get(id)!;
      p.status = 'succeeded';
      p.applied++;
    },
  };
  return { repo, payments };
}

function fakeProvider(remote: Partial<ProviderPayment> = {}): PaymentProvider {
  return {
    name: 'konnect',
    createCheckout: async (req) => ({ redirectUrl: `https://pay.example/${req.paymentId}`, providerRef: `ref-${req.paymentId}` }),
    fetchPayment: async () => ({ status: 'succeeded', amountMillimes: 12000, orderId: null, raw: {}, ...remote }),
  };
}

describe('checkout and webhook', () => {
  it('creates a pending payment and returns the provider URL', async () => {
    const { repo, payments } = memoryRepo();
    const res = await startCheckout({ repo, provider: fakeProvider(), appUrl: 'https://chouf.tn' }, { userId: 'u', email: 'a@b.c', planCode: 'monthly', locale: 'fr' });
    expect(res).toEqual({ ok: true, redirectUrl: 'https://pay.example/pay-1' });
    expect(payments.get('pay-1')).toMatchObject({ status: 'pending', provider_ref: 'ref-pay-1' });
  });

  it('applies a successful payment exactly once even when notified twice', async () => {
    const { repo, payments } = memoryRepo();
    const provider = fakeProvider();
    await startCheckout({ repo, provider, appUrl: 'https://chouf.tn' }, { userId: 'u', email: null, planCode: 'monthly', locale: 'ar' });
    expect(await handlePaymentNotification({ repo, provider }, 'ref-pay-1')).toBe('applied');
    expect(await handlePaymentNotification({ repo, provider }, 'ref-pay-1')).toBe('already_applied');
    expect(payments.get('pay-1')!.applied).toBe(1);
  });

  it('grants nothing for pending, failed, unknown or mismatched payments', async () => {
    for (const [remote, outcome] of [
      [{ status: 'pending' }, 'pending'],
      [{ status: 'failed' }, 'failed'],
      [{ amountMillimes: 1 }, 'amount_mismatch'],
    ] as const) {
      const { repo, payments } = memoryRepo();
      const provider = fakeProvider(remote);
      await startCheckout({ repo, provider, appUrl: 'https://chouf.tn' }, { userId: 'u', email: null, planCode: 'monthly', locale: 'ar' });
      expect(await handlePaymentNotification({ repo, provider }, 'ref-pay-1')).toBe(outcome);
      expect(payments.get('pay-1')!.applied).toBe(0);
    }
    const { repo } = memoryRepo();
    expect(await handlePaymentNotification({ repo, provider: fakeProvider() }, 'nope')).toBe('unknown_payment');
  });

  it('rejects unknown plans', async () => {
    const { repo } = memoryRepo();
    expect(await startCheckout({ repo, provider: fakeProvider(), appUrl: 'https://x' }, { userId: 'u', email: null, planCode: 'gold', locale: 'fr' })).toEqual({ ok: false, reason: 'unknown_plan' });
  });
});

describe('Konnect provider', () => {
  it('sends the amount in millimes and maps the payment status', async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchImpl: typeof fetch = async (url, init) => {
      calls.push({ url: String(url), init: init! });
      const body = String(url).endsWith('/init-payment')
        ? { payUrl: 'https://gateway.sandbox.konnect.network/pay?ref=abc', paymentRef: 'abc' }
        : { payment: { status: 'completed', amount: 12000, orderId: 'pay-1' } };
      return new Response(JSON.stringify(body), { status: 200 });
    };
    const konnect = createKonnectProvider({ apiUrl: 'https://api.sandbox.konnect.network/api/v2/', apiKey: 'k', walletId: 'w', fetchImpl });
    const session = await konnect.createCheckout({
      paymentId: 'pay-1', amountMillimes: 12000, currency: 'TND', description: 'x', customer: { email: null },
      successUrl: 'https://s', failUrl: 'https://f', webhookUrl: 'https://w',
    });
    expect(session).toEqual({ redirectUrl: 'https://gateway.sandbox.konnect.network/pay?ref=abc', providerRef: 'abc' });
    expect(calls[0]!.url).toBe('https://api.sandbox.konnect.network/api/v2/payments/init-payment');
    expect(JSON.parse(String(calls[0]!.init.body))).toMatchObject({ amount: 12000, token: 'TND', receiverWalletId: 'w', orderId: 'pay-1' });
    expect((calls[0]!.init.headers as Record<string, string>)['x-api-key']).toBe('k');
    expect(await konnect.fetchPayment('abc')).toMatchObject({ status: 'succeeded', amountMillimes: 12000 });
    await expect(konnect.fetchPayment('../evil')).rejects.toThrow('invalid payment ref');
  });
});
