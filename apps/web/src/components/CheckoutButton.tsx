'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

export function CheckoutButton({ planCode, label }: { planCode: string; label: string }) {
  const t = useTranslations('subscribe');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const res = await fetch('/api/payments/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ planCode }),
          });
          const data = (await res.json().catch(() => ({}))) as { redirectUrl?: string; error?: string };
          if (res.ok && data.redirectUrl) {
            window.location.assign(data.redirectUrl);
            return;
          }
          setBusy(false);
          setError(data.error === 'auth_required' ? t('loginFirst') : data.error === 'payments_unavailable' ? t('unavailable') : t('failed'));
        }}
        className="w-full rounded-md bg-brand py-2.5 font-semibold hover:bg-brand-dark disabled:opacity-60"
      >
        {busy ? '…' : label}
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
