'use client';

import type { ChannelRow } from '@chouf/shared';
import { useActionState } from 'react';
import type { ActionState } from '@/server/actions/admin';
import { saveChannelAction } from '@/server/actions/live-admin';
import { ArtworkInput } from './ArtworkInput';
import { I18nInputs, L, inputCls } from './fields';

const CATEGORIES = { general: 'Généraliste', news: 'Information', sports: 'Sport', kids: 'Jeunesse', entertainment: 'Divertissement', religious: 'Religieux', music: 'Musique', documentary: 'Documentaire' };

export function ChannelForm({ channel, assetsBaseUrl }: { channel?: ChannelRow; assetsBaseUrl: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveChannelAction, {});
  return (
    <form action={action} className="space-y-5 rounded-lg border border-line bg-panel p-5">
      {channel && <input type="hidden" name="id" value={channel.id} />}
      <div className="grid gap-4 sm:grid-cols-4">
        <L label="Slug (URL)"><input name="slug" defaultValue={channel?.slug} required pattern="[a-z0-9]+(-[a-z0-9]+)*" className={inputCls} /></L>
        <L label="Catégorie">
          <select name="category" defaultValue={channel?.category ?? 'general'} className={inputCls}>
            {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </L>
        <L label="Pays (ISO)"><input name="country" defaultValue={channel?.country ?? 'TN'} required maxLength={2} className={`${inputCls} uppercase`} /></L>
        <L label="Langue (ISO)"><input name="language" defaultValue={channel?.language ?? 'ar'} required maxLength={2} className={`${inputCls} lowercase`} /></L>
      </div>
      <I18nInputs name="name" label="Nom" values={channel?.name} />
      <div className="grid gap-4 sm:grid-cols-4">
        <L label="Statut">
          <select name="status" defaultValue={channel?.status ?? 'inactive'} className={inputCls}>
            <option value="inactive">Inactive (masquée)</option>
            <option value="active">Active</option>
          </select>
        </L>
        <L label="Accès">
          <select name="access" defaultValue={channel?.access ?? 'subscriber'} className={inputCls}>
            <option value="subscriber">Abonnés</option>
            <option value="free">Gratuit</option>
          </select>
        </L>
        <L label="Ordre d’affichage"><input name="sort_order" type="number" defaultValue={channel?.sort_order ?? 0} className={inputCls} /></L>
      </div>
      <ArtworkInput name="logo_path" label="Logo" initialPath={channel?.logo_path ?? null} assetsBaseUrl={assetsBaseUrl} />
      {channel?.auto_disabled_reason && <p className="text-sm text-amber-400">Désactivée automatiquement : {channel.auto_disabled_reason}. Enregistrer la réactive.</p>}
      <div className="flex items-center gap-4">
        <button disabled={pending} className="rounded-md bg-brand px-5 py-2 font-semibold hover:bg-brand-dark disabled:opacity-60">{pending ? 'Enregistrement…' : 'Enregistrer'}</button>
        {state.ok && <span className="text-sm text-emerald-400">Enregistré.</span>}
        {state.error && <span className="text-sm text-red-400">{state.error}</span>}
      </div>
    </form>
  );
}
