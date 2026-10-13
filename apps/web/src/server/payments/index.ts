import 'server-only';
import type { Json } from '@chouf/shared';
import { env } from '../env';
import type { ServiceClient } from '../supabase';
import { createKonnectProvider } from './konnect';
import type { PaymentProvider } from './provider';
import type { PaymentsRepo } from './service';

export function getPaymentProvider(name = 'konnect'): PaymentProvider | null {
  const e = env();
  if (name === 'konnect' && e.KONNECT_API_KEY && e.KONNECT_WALLET_ID) {
    return createKonnectProvider({ apiUrl: e.KONNECT_API_URL, apiKey: e.KONNECT_API_KEY, walletId: e.KONNECT_WALLET_ID });
  }
  return null;
}

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export function createPaymentsRepo(db: ServiceClient): PaymentsRepo {
  return {
    async getPlan(code) {
      const { data, error } = await db
        .from('plans')
        .select('id, code, price_millimes, currency, name')
        .eq('code', code)
        .eq('active', true)
        .maybeSingle();
      fail(error);
      return data ? { ...data, name: data.name as Record<string, string> } : null;
    },
    async createPendingPayment({ userId, planId, provider, amountMillimes, currency }) {
      const { data, error } = await db
        .from('payments')
        .insert({ user_id: userId, plan_id: planId, provider, amount_millimes: amountMillimes, currency })
        .select('id')
        .single();
      fail(error);
      return data!.id;
    },
    async setProviderRef(paymentId, providerRef) {
      fail((await db.from('payments').update({ provider_ref: providerRef }).eq('id', paymentId)).error);
    },
    async findByProviderRef(provider, providerRef) {
      const { data, error } = await db
        .from('payments')
        .select('id, status, amount_millimes')
        .eq('provider', provider)
        .eq('provider_ref', providerRef)
        .maybeSingle();
      fail(error);
      return data;
    },
    async markFailed(paymentId, raw) {
      fail((await db.from('payments').update({ status: 'failed', raw: raw as Json }).eq('id', paymentId).eq('status', 'pending')).error);
    },
    async applySuccess(paymentId, raw) {
      fail((await db.rpc('apply_successful_payment', { p_payment_id: paymentId, p_raw: raw as Json })).error);
    },
  };
}
