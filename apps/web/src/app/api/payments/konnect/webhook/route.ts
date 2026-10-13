import { createPaymentsRepo, getPaymentProvider } from '@/server/payments';
import { handlePaymentNotification } from '@/server/payments/service';
import { createServiceClient } from '@/server/supabase';
import { NextResponse } from 'next/server';

/** Konnect calls GET {webhook}?payment_ref=…; the status is then fetched from Konnect itself. */
async function handle(request: Request) {
  const ref = new URL(request.url).searchParams.get('payment_ref');
  if (!ref || !/^[A-Za-z0-9_-]{1,100}$/.test(ref)) return NextResponse.json({ error: 'invalid_ref' }, { status: 400 });
  const provider = getPaymentProvider('konnect');
  if (!provider) return NextResponse.json({ error: 'payments_unavailable' }, { status: 503 });
  try {
    const outcome = await handlePaymentNotification({ repo: createPaymentsRepo(createServiceClient()), provider }, ref);
    return NextResponse.json({ outcome });
  } catch (err) {
    console.error('konnect webhook failed', err);
    // 5xx lets Konnect retry later.
    return NextResponse.json({ error: 'processing_failed' }, { status: 502 });
  }
}

export const GET = handle;
export const POST = handle;
