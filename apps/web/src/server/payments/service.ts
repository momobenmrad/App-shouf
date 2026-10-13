import type { PaymentProvider } from './provider';

/** Persistence used by checkout/webhook handling; implemented with the service client. */
export interface PaymentsRepo {
  getPlan(code: string): Promise<{ id: string; code: string; price_millimes: number; currency: string; name: Record<string, string> } | null>;
  createPendingPayment(input: { userId: string; planId: string; provider: string; amountMillimes: number; currency: string }): Promise<string>;
  setProviderRef(paymentId: string, providerRef: string): Promise<void>;
  findByProviderRef(provider: string, providerRef: string): Promise<{ id: string; status: string; amount_millimes: number } | null>;
  markFailed(paymentId: string, raw: unknown): Promise<void>;
  applySuccess(paymentId: string, raw: unknown): Promise<void>;
}

export async function startCheckout(
  deps: { repo: PaymentsRepo; provider: PaymentProvider; appUrl: string },
  input: { userId: string; email: string | null; planCode: string; locale: string },
): Promise<{ ok: true; redirectUrl: string } | { ok: false; reason: 'unknown_plan' }> {
  const plan = await deps.repo.getPlan(input.planCode);
  if (!plan) return { ok: false, reason: 'unknown_plan' };
  const paymentId = await deps.repo.createPendingPayment({
    userId: input.userId,
    planId: plan.id,
    provider: deps.provider.name,
    amountMillimes: plan.price_millimes,
    currency: plan.currency,
  });
  const app = deps.appUrl.replace(/\/+$/, '');
  const session = await deps.provider.createCheckout({
    paymentId,
    amountMillimes: plan.price_millimes,
    currency: plan.currency,
    description: `Chouf — ${plan.name.fr ?? plan.code}`,
    customer: { email: input.email },
    successUrl: `${app}/${input.locale}/account?payment=success`,
    failUrl: `${app}/${input.locale}/subscribe?payment=failed`,
    webhookUrl: `${app}/api/payments/${deps.provider.name}/webhook`,
  });
  await deps.repo.setProviderRef(paymentId, session.providerRef);
  return { ok: true, redirectUrl: session.redirectUrl };
}

export type WebhookOutcome = 'applied' | 'already_applied' | 'pending' | 'failed' | 'unknown_payment' | 'amount_mismatch';

/**
 * Handles a provider notification. The provider is queried for the real status; the payment is
 * applied only when it succeeded for the expected amount. Safe to call any number of times.
 */
export async function handlePaymentNotification(
  deps: { repo: PaymentsRepo; provider: PaymentProvider },
  providerRef: string,
): Promise<WebhookOutcome> {
  const payment = await deps.repo.findByProviderRef(deps.provider.name, providerRef);
  if (!payment) return 'unknown_payment';
  if (payment.status === 'succeeded') return 'already_applied';

  const remote = await deps.provider.fetchPayment(providerRef);
  if (remote.status === 'pending') return 'pending';
  if (remote.status === 'failed') {
    await deps.repo.markFailed(payment.id, remote.raw);
    return 'failed';
  }
  if (remote.amountMillimes !== null && remote.amountMillimes !== payment.amount_millimes) {
    await deps.repo.markFailed(payment.id, remote.raw);
    return 'amount_mismatch';
  }
  await deps.repo.applySuccess(payment.id, remote.raw);
  return 'applied';
}
