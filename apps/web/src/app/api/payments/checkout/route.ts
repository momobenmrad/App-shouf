import { checkoutSchema } from '@chouf/shared';
import { env } from '@/server/env';
import { isSameOrigin, json, jsonError, parseBody } from '@/server/http';
import { createPaymentsRepo, getPaymentProvider } from '@/server/payments';
import { startCheckout } from '@/server/payments/service';
import { createServiceClient, createUserClient } from '@/server/supabase';

export async function POST(request: Request) {
  if (!isSameOrigin(request, env().APP_URL)) return jsonError(403, 'cross_origin');
  const body = await parseBody(request, checkoutSchema);
  if (!body.ok) return body.response;

  const supabase = await createUserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError(401, 'auth_required');

  const provider = getPaymentProvider();
  if (!provider) return jsonError(503, 'payments_unavailable');

  const { data: profile } = await supabase.from('profiles').select('locale').eq('id', user.id).single();
  const result = await startCheckout(
    { repo: createPaymentsRepo(createServiceClient()), provider, appUrl: env().APP_URL },
    { userId: user.id, email: user.email ?? null, planCode: body.data.planCode, locale: profile?.locale ?? 'ar' },
  );
  if (!result.ok) return jsonError(404, result.reason);
  return json({ redirectUrl: result.redirectUrl });
}
