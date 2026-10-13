'use client';

import { type ChannelDraft, playlistToDrafts } from '@chouf/shared';
import { useActionState, useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { type ImportResult, importM3uAction } from '@/server/actions/m3u-import';
import { L, inputCls } from './fields';

const CATEGORY: Record<ChannelDraft['category'], string> = {
  general: 'Généraliste',
  news: 'Information',
  sports: 'Sport',
  kids: 'Jeunesse',
  entertainment: 'Divertissement',
  religious: 'Religieux',
  music: 'Musique',
  documentary: 'Documentaire',
};

export function M3uImport() {
  const [state, action, pending] = useActionState<ImportResult, FormData>(importM3uAction, {});
  const [text, setText] = useState('');
  const [includeRadios, setIncludeRadios] = useState(false);

  // Same parser as the server: the preview is exactly what will be imported.
  const preview = useMemo(() => (text.trim() ? playlistToDrafts(text, { includeRadios }) : null), [text, includeRadios]);

  async function onFile(file: File) {
    if (file.size > 2 * 1024 * 1024) return setText('');
    setText(await file.text());
  }

  if (state.created) {
    return (
      <div className="space-y-4 rounded-lg border border-emerald-800 bg-emerald-950/30 p-5 text-sm">
        <p className="text-base font-semibold text-emerald-300">
          {state.created.length} chaîne{state.created.length > 1 ? 's' : ''} créée{state.created.length > 1 ? 's' : ''}, en statut « inactive ».
        </p>
        {!!state.existing?.length && <p className="text-muted">Déjà présentes, non modifiées : {state.existing.join(', ')}</p>}
        <p>
          Pour diffuser une chaîne : ouvrez-la, ajoutez sa source avec l’adresse <strong>officielle</strong> fournie par le diffuseur et les informations de la licence, puis passez-la en « active ».
        </p>
        <ul className="grid gap-1 sm:grid-cols-2">
          {state.created.map((c) => (
            <li key={c.slug}>
              • {c.name} <span className="text-muted">({c.slug})</span>
            </li>
          ))}
        </ul>
        <Link href="/admin/channels" locale="fr" className="inline-block rounded-md bg-brand px-4 py-2 font-semibold hover:bg-brand-dark">
          Voir les chaînes
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <div className="rounded-lg border border-amber-800/70 bg-amber-950/20 p-4 text-sm text-amber-200">
        L’import crée les fiches des chaînes (nom, catégorie, pays, langue, identifiant du guide). <strong>Il ne crée aucune source</strong> : chaque flux doit être ajouté ensuite avec la licence du diffuseur. Les adresses de la playlist sont seulement affichées ci-dessous pour mémoire.
      </div>

      <div className="space-y-3 rounded-lg border border-line bg-panel p-5">
        <div className="flex flex-wrap items-center gap-3">
          <input type="file" accept=".m3u,.m3u8,audio/x-mpegurl,application/vnd.apple.mpegurl,text/plain" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} className="text-xs" />
          <span className="text-xs text-muted">ou collez le contenu :</span>
        </div>
        <textarea
          name="playlist"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          dir="ltr"
          spellCheck={false}
          placeholder={'#EXTM3U\n#EXTINF:-1 tvg-id="watania1.tn" group-title="TV",الوطنية 1 | Watania 1\nhttp://…/index.m3u8'}
          className={`${inputCls} font-mono text-xs`}
        />
        <div className="grid gap-4 sm:grid-cols-4">
          <L label="Pays par défaut (ISO)">
            <input name="country" defaultValue="TN" maxLength={2} className={`${inputCls} uppercase`} />
          </L>
          <L label="Langue par défaut (ISO)">
            <input name="language" defaultValue="ar" maxLength={2} className={`${inputCls} lowercase`} />
          </L>
          <L label="Accès des chaînes créées">
            <select name="access" defaultValue="subscriber" className={inputCls}>
              <option value="subscriber">Abonnés</option>
              <option value="free">Gratuit</option>
            </select>
          </L>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input type="checkbox" name="include_radios" checked={includeRadios} onChange={(e) => setIncludeRadios(e.target.checked)} /> Inclure les radios
          </label>
        </div>
      </div>

      {preview && (
        <section className="space-y-3">
          <h2 className="font-semibold">
            Aperçu : {preview.drafts.length} chaîne{preview.drafts.length > 1 ? 's' : ''} à créer
            {preview.skipped.length > 0 && <span className="font-normal text-muted"> · {preview.skipped.length} ignorée{preview.skipped.length > 1 ? 's' : ''}</span>}
            {preview.errors.length > 0 && <span className="font-normal text-red-400"> · {preview.errors.length} erreur{preview.errors.length > 1 ? 's' : ''}</span>}
          </h2>
          {preview.epgUrl && <p className="text-xs text-muted">Guide XMLTV annoncé par la playlist : <code dir="ltr">{preview.epgUrl}</code> (à saisir sur chaque chaîne si vous en avez le droit).</p>}
          <div className="max-h-[420px] overflow-auto rounded-lg border border-line">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-panel text-left text-muted">
                <tr>
                  <th className="p-2">Slug</th><th className="p-2">Nom</th><th className="p-2">Catégorie</th><th className="p-2">Pays / langue</th><th className="p-2">Guide</th><th className="p-2">Adresse (non importée)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {preview.drafts.map((d) => (
                  <tr key={d.slug}>
                    <td className="p-2 font-mono">{d.slug}</td>
                    <td className="p-2">{[d.name.fr, d.name.ar].filter(Boolean).join(' · ')}</td>
                    <td className="p-2">{CATEGORY[d.category]}{d.radio && ' · radio'}</td>
                    <td className="p-2">{d.country} / {d.language}</td>
                    <td className="p-2 font-mono">{d.epg_channel_id ?? '—'}</td>
                    <td className="max-w-[260px] truncate p-2 font-mono text-muted" dir="ltr" title={d.stream_url}>
                      {d.stream_url}
                      {!d.hls && !d.radio && <span className="ms-1 text-amber-400">(pas HLS)</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(preview.skipped.length > 0 || preview.errors.length > 0) && (
            <details className="text-xs text-muted">
              <summary className="cursor-pointer">Détail des lignes ignorées</summary>
              <ul className="mt-2 space-y-0.5">
                {preview.skipped.map((s) => <li key={`s${s.line}`}>Ligne {s.line} · {s.name} : {s.reason}</li>)}
                {preview.errors.map((e) => <li key={`e${e.line}`} className="text-red-400">Ligne {e.line} : {e.message}</li>)}
              </ul>
            </details>
          )}
        </section>
      )}

      <div className="flex items-center gap-4">
        <button disabled={pending || !preview?.drafts.length} className="rounded-md bg-brand px-5 py-2 font-semibold hover:bg-brand-dark disabled:opacity-50">
          {pending ? 'Import…' : `Créer ${preview?.drafts.length ?? 0} chaîne${(preview?.drafts.length ?? 0) > 1 ? 's' : ''}`}
        </button>
        {state.error && <span className="text-sm text-red-400">{state.error}</span>}
      </div>
    </form>
  );
}
