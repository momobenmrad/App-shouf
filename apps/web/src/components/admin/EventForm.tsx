'use client';

import type { LiveEventRow } from '@chouf/shared';
import { useActionState } from 'react';
import { type EventActionState, saveEventAction } from '@/server/actions/live-admin';
import { ArtworkInput } from './ArtworkInput';
import { I18nInputs, L, inputCls } from './fields';

const toLocalInput = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');

export function EventForm({ event, assetsBaseUrl }: { event?: LiveEventRow; assetsBaseUrl: string }) {
  const [state, action, pending] = useActionState<EventActionState, FormData>(saveEventAction, {});
  return (
    <form action={action} className="space-y-5 rounded-lg border border-line bg-panel p-5">
      {event && <input type="hidden" name="id" value={event.id} />}
      <div className="grid gap-4 sm:grid-cols-3">
        <L label={event ? 'Slug (fixe : définit le chemin d’ingestion)' : 'Slug (URL et chemin d’ingestion)'}>
          <input name="slug" defaultValue={event?.slug} required readOnly={!!event} pattern="[a-z0-9]+(-[a-z0-9]+)*" className={`${inputCls} read-only:opacity-60`} />
        </L>
        <L label="Début prévu"><input name="scheduled_at" type="datetime-local" defaultValue={toLocalInput(event?.scheduled_at ?? null)} className={inputCls} /></L>
        <L label="Accès">
          <select name="access" defaultValue={event?.access ?? 'subscriber'} className={inputCls}>
            <option value="subscriber">Abonnés</option>
            <option value="free">Gratuit</option>
          </select>
        </L>
      </div>
      <I18nInputs name="name" label="Titre" values={event?.name} />
      <I18nInputs name="description" label="Description" values={event?.description} multiline />
      <L label="Territoires autorisés (vide = monde)"><input name="geo_allow" defaultValue={event?.geo_allow.join(', ')} placeholder="TN, DZ, MA" className={inputCls} /></L>
      <ArtworkInput name="poster_path" label="Visuel (16:9)" initialPath={event?.poster_path ?? null} assetsBaseUrl={assetsBaseUrl} />
      <div className="flex flex-wrap gap-6 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" name="published" defaultChecked={event?.published ?? false} /> Publié (visible sur /live)</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="chat_enabled" defaultChecked={event?.chat_enabled ?? true} /> Chat activé</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="record" defaultChecked={event?.record ?? true} /> Enregistrer pour le replay</label>
      </div>
      <div className="flex items-center gap-4">
        <button disabled={pending} className="rounded-md bg-brand px-5 py-2 font-semibold hover:bg-brand-dark disabled:opacity-60">{pending ? 'Enregistrement…' : event ? 'Enregistrer' : 'Créer l’événement'}</button>
        {state.ok && <span className="text-sm text-emerald-400">Enregistré.</span>}
        {state.error && <span className="text-sm text-red-400">{state.error}</span>}
      </div>
    </form>
  );
}
