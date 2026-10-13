'use client';

import type { EpisodeRow } from '@chouf/shared';
import { useActionState } from 'react';
import { type ActionState, saveEpisodeAction } from '@/server/actions/admin';
import { I18nInputs, L, inputCls } from './fields';
import type { AssetOption } from './TitleForm';

export function EpisodeForm({ titleId, seasonId, episode, nextNumber, assets }: { titleId: string; seasonId: string; episode?: EpisodeRow; nextNumber?: number; assets: AssetOption[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveEpisodeAction, {});
  return (
    <form action={action} className="space-y-3 rounded-md border border-line bg-ink/60 p-4">
      <input type="hidden" name="title_id" value={titleId} />
      <input type="hidden" name="season_id" value={seasonId} />
      {episode && <input type="hidden" name="id" value={episode.id} />}
      <div className="grid gap-3 sm:grid-cols-4">
        <L label="N°"><input name="number" type="number" min={1} defaultValue={episode?.number ?? nextNumber} required className={inputCls} /></L>
        <L label="Statut">
          <select name="status" defaultValue={episode?.status ?? 'draft'} className={inputCls}>
            <option value="draft">Brouillon</option><option value="published">Publié</option><option value="archived">Archivé</option>
          </select>
        </L>
        <L label="Accès">
          <select name="access" defaultValue={episode?.access ?? ''} className={inputCls}>
            <option value="">Comme la série</option><option value="free">Gratuit</option><option value="subscriber">Abonnés</option>
          </select>
        </L>
        <L label="Vidéo">
          <select name="asset_id" defaultValue={episode?.asset_id ?? ''} className={inputCls}>
            <option value="">— aucune —</option>
            {assets.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </L>
      </div>
      <I18nInputs name="name" label="Titre" values={episode?.name} />
      <I18nInputs name="synopsis" label="Résumé" values={episode?.synopsis} />
      <div className="flex items-center gap-3">
        <button disabled={pending} className="rounded bg-white/10 px-4 py-1.5 text-sm hover:bg-white/20">{episode ? 'Mettre à jour' : 'Ajouter l’épisode'}</button>
        {state.ok && <span className="text-xs text-emerald-400">Enregistré.</span>}
        {state.error && <span className="text-xs text-red-400">{state.error}</span>}
      </div>
    </form>
  );
}
