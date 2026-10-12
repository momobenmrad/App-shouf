'use client';

import type { GenreRow, TitleRow } from '@chouf/shared';
import { useActionState, useState } from 'react';
import { type ActionState, saveTitleAction } from '@/server/actions/admin';
import { ArtworkInput } from './ArtworkInput';
import { I18nInputs, L, inputCls } from './fields';

export interface AssetOption {
  id: string;
  label: string;
}

export function TitleForm({ title, genres, selectedGenres, assets, assetsBaseUrl }: { title?: TitleRow; genres: GenreRow[]; selectedGenres: string[]; assets: AssetOption[]; assetsBaseUrl: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveTitleAction, {});
  const [kind, setKind] = useState(title?.kind ?? 'movie');
  return (
    <form action={action} className="space-y-5 rounded-lg border border-line bg-panel p-5">
      {title && <input type="hidden" name="id" value={title.id} />}
      <div className="grid gap-4 sm:grid-cols-4">
        <L label="Type">
          <select name="kind" value={kind} onChange={(e) => setKind(e.target.value as 'movie' | 'series')} disabled={!!title} className={inputCls}>
            <option value="movie">Film</option>
            <option value="series">Série</option>
          </select>
          {title && <input type="hidden" name="kind" value={kind} />}
        </L>
        <L label="Slug (URL)"><input name="slug" defaultValue={title?.slug} required pattern="[a-z0-9]+(-[a-z0-9]+)*" className={inputCls} /></L>
        <L label="Année"><input name="release_year" type="number" min={1900} max={2100} defaultValue={title?.release_year ?? ''} className={inputCls} /></L>
        <L label="Classification">
          <select name="maturity_rating" defaultValue={title?.maturity_rating ?? 'all'} className={inputCls}>
            {['all', '10+', '12+', '16+', '18+'].map((r) => <option key={r} value={r}>{r === 'all' ? 'Tous publics' : r}</option>)}
          </select>
        </L>
      </div>
      <I18nInputs name="name" label="Titre" values={title?.name} />
      <I18nInputs name="synopsis" label="Synopsis" values={title?.synopsis} multiline />
      <div className="grid gap-4 sm:grid-cols-4">
        <L label="Accès">
          <select name="access" defaultValue={title?.access ?? 'subscriber'} className={inputCls}>
            <option value="subscriber">Abonnés</option>
            <option value="free">Gratuit</option>
          </select>
        </L>
        <L label="Statut">
          <select name="status" defaultValue={title?.status ?? 'draft'} className={inputCls}>
            <option value="draft">Brouillon</option>
            <option value="published">Publié</option>
            <option value="archived">Archivé</option>
          </select>
        </L>
        <L label="Territoires autorisés (vide = monde)" className="sm:col-span-2">
          <input name="geo_allow" defaultValue={title?.geo_allow.join(', ')} placeholder="TN, DZ, MA" className={inputCls} />
        </L>
      </div>
      {kind === 'movie' && (
        <L label="Vidéo (assets prêts)">
          <select name="asset_id" defaultValue={title?.asset_id ?? ''} className={inputCls}>
            <option value="">— aucune —</option>
            {assets.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </L>
      )}
      <fieldset>
        <legend className="mb-2 text-xs font-medium text-muted">Genres</legend>
        <div className="flex flex-wrap gap-3 text-sm">
          {genres.map((g) => (
            <label key={g.id} className="flex items-center gap-1.5">
              <input type="checkbox" name="genre_ids" value={g.id} defaultChecked={selectedGenres.includes(g.id)} />
              {g.name.fr ?? g.slug}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <ArtworkInput name="poster_path" label="Affiche (2:3)" initialPath={title?.poster_path ?? null} assetsBaseUrl={assetsBaseUrl} />
        <ArtworkInput name="backdrop_path" label="Image de fond (16:9)" initialPath={title?.backdrop_path ?? null} assetsBaseUrl={assetsBaseUrl} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="featured" defaultChecked={title?.featured} /> Mettre en avant sur l’accueil
      </label>
      <div className="flex items-center gap-4">
        <button disabled={pending} className="rounded-md bg-brand px-5 py-2 font-semibold hover:bg-brand-dark disabled:opacity-60">{pending ? 'Enregistrement…' : 'Enregistrer'}</button>
        {state.ok && <span className="text-sm text-emerald-400">Enregistré.</span>}
        {state.error && <span className="text-sm text-red-400">{state.error}</span>}
      </div>
    </form>
  );
}
