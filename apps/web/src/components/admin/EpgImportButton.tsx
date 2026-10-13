'use client';

import { useActionState } from 'react';
import type { ActionState } from '@/server/actions/admin';
import { importEpgNowAction } from '@/server/actions/live-admin';

export function EpgImportButton({ channelId, programmeCount }: { channelId: string; programmeCount: number }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(importEpgNowAction, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-3 text-sm">
      <input type="hidden" name="id" value={channelId} />
      <span className="text-muted">{programmeCount} programme{programmeCount > 1 ? 's' : ''} à venir</span>
      <button disabled={pending} className="rounded bg-white/10 px-3 py-1.5 hover:bg-white/20 disabled:opacity-60">{pending ? 'Import…' : 'Importer le guide maintenant'}</button>
      {state.ok && <span className="text-emerald-400">Guide importé.</span>}
      {state.error && <span className="text-red-400">{state.error}</span>}
    </form>
  );
}
