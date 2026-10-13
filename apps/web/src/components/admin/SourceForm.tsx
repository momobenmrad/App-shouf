'use client';

import type { ChannelSourceRow } from '@chouf/shared';
import { useActionState } from 'react';
import type { ActionState } from '@/server/actions/admin';
import { saveSourceAction } from '@/server/actions/live-admin';
import { L, inputCls } from './fields';

export function SourceForm({ channelId, source, nextPriority }: { channelId: string; source?: ChannelSourceRow; nextPriority?: number }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveSourceAction, {});
  const lic = source?.license_info;
  return (
    <form action={action} className="space-y-4 rounded-md border border-line bg-ink/60 p-4">
      <input type="hidden" name="channel_id" value={channelId} />
      {source && <input type="hidden" name="id" value={source.id} />}
      <div className="grid gap-3 sm:grid-cols-6">
        <L label="Libellé" className="sm:col-span-2"><input name="label" defaultValue={source?.label ?? (nextPriority === 1 ? 'Principale' : 'Secours')} required className={inputCls} /></L>
        <L label="Priorité (1 = principale)"><input name="priority" type="number" min={1} max={20} defaultValue={source?.priority ?? nextPriority} required className={inputCls} /></L>
        <L label="Type">
          <select name="kind" defaultValue={source?.kind ?? 'external_hls'} className={inputCls}>
            <option value="external_hls">Flux HLS externe</option>
            <option value="internal_ingest">Ingestion interne (MediaMTX)</option>
          </select>
        </L>
        <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" name="enabled" defaultChecked={source?.enabled ?? true} /> Activée</label>
        {source && <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" name="reset_health" /> Réinitialiser la santé</label>}
      </div>
      <L label="URL de la playlist HLS (jamais exposée aux spectateurs)"><input name="url" type="url" defaultValue={source?.url} required placeholder="https://…/index.m3u8" className={inputCls} dir="ltr" /></L>
      <fieldset className="space-y-3 rounded-md border border-amber-900/60 p-3">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-amber-400">Licence (obligatoire)</legend>
        <div className="grid gap-3 sm:grid-cols-4">
          <L label="Titulaire des droits"><input name="license_holder" defaultValue={lic?.holder} required className={inputCls} /></L>
          <L label="Référence de l’accord"><input name="license_ref" defaultValue={lic?.agreement_ref} required className={inputCls} /></L>
          <L label="Expire le"><input name="license_expires_at" type="date" defaultValue={lic?.expires_at} required className={inputCls} /></L>
          <L label="Territoires (ISO, séparés par des virgules)"><input name="license_territories" defaultValue={lic?.territories.join(', ')} required placeholder="TN, DZ, MA" className={`${inputCls} uppercase`} /></L>
        </div>
        <L label="Notes"><input name="license_notes" defaultValue={lic?.notes ?? ''} className={inputCls} /></L>
      </fieldset>
      <div className="flex items-center gap-3">
        <button disabled={pending} className="rounded bg-white/10 px-4 py-1.5 text-sm hover:bg-white/20">{source ? 'Mettre à jour' : 'Ajouter la source'}</button>
        {state.ok && <span className="text-xs text-emerald-400">Enregistré.</span>}
        {state.error && <span className="text-xs text-red-400">{state.error}</span>}
      </div>
    </form>
  );
}
