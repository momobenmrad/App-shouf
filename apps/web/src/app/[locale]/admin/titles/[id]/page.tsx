import { pickText } from '@chouf/shared';
import { notFound } from 'next/navigation';
import { EpisodeForm } from '@/components/admin/EpisodeForm';
import { TitleForm } from '@/components/admin/TitleForm';
import { I18nInputs, L, inputCls } from '@/components/admin/fields';
import { deleteEpisodeAction, deleteSeasonAction, deleteTitleAction, saveSeasonAction } from '@/server/actions/admin';
import { readyAssets } from '@/server/admin-data';
import { env } from '@/server/env';
import { createUserClient } from '@/server/supabase';

export default async function EditTitle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const db = await createUserClient();
  const [{ data: title }, { data: genres }, { data: links }, { data: seasons }, assets] = await Promise.all([
    db.from('titles').select('*').eq('id', id).maybeSingle(),
    db.from('genres').select('*').order('slug'),
    db.from('title_genres').select('genre_id').eq('title_id', id),
    db.from('seasons').select('*, episodes(*)').eq('title_id', id).order('number'),
    readyAssets(db),
  ]);
  if (!title) notFound();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{pickText(title.name, 'fr')}</h1>
        <form action={deleteTitleAction}>
          <input type="hidden" name="id" value={title.id} />
          <button className="text-sm text-red-400 hover:text-red-300">Supprimer le titre</button>
        </form>
      </div>
      <TitleForm title={title} genres={genres ?? []} selectedGenres={(links ?? []).map((l) => l.genre_id)} assets={assets} assetsBaseUrl={env().VOD_BASE_URL} />

      {title.kind === 'series' && (
        <section className="space-y-6">
          <h2 className="text-xl font-bold">Saisons et épisodes</h2>
          {(seasons ?? []).map((season) => {
            const episodes = [...season.episodes].sort((a, b) => a.number - b.number);
            return (
              <div key={season.id} className="space-y-3 rounded-lg border border-line bg-panel p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Saison {season.number} {pickText(season.name, 'fr') && `— ${pickText(season.name, 'fr')}`}</h3>
                  <form action={deleteSeasonAction}>
                    <input type="hidden" name="id" value={season.id} />
                    <input type="hidden" name="title_id" value={title.id} />
                    <button className="text-xs text-red-400">Supprimer la saison</button>
                  </form>
                </div>
                {episodes.map((ep) => (
                  <div key={ep.id} className="relative">
                    <EpisodeForm titleId={title.id} seasonId={season.id} episode={ep} assets={assets} />
                    <form action={deleteEpisodeAction} className="absolute end-4 top-4">
                      <input type="hidden" name="id" value={ep.id} />
                      <input type="hidden" name="title_id" value={title.id} />
                      <button className="text-xs text-red-400">Supprimer</button>
                    </form>
                  </div>
                ))}
                <details>
                  <summary className="cursor-pointer text-sm text-muted">+ Ajouter un épisode</summary>
                  <div className="mt-3">
                    <EpisodeForm titleId={title.id} seasonId={season.id} nextNumber={(episodes.at(-1)?.number ?? 0) + 1} assets={assets} />
                  </div>
                </details>
              </div>
            );
          })}
          <form action={saveSeasonAction} className="space-y-3 rounded-lg border border-dashed border-line p-5">
            <input type="hidden" name="title_id" value={title.id} />
            <L label="Nouvelle saison — numéro">
              <input name="number" type="number" min={1} defaultValue={(seasons?.at(-1)?.number ?? 0) + 1} className={`${inputCls} max-w-32`} />
            </L>
            <I18nInputs name="name" label="Nom (optionnel)" />
            <button className="rounded bg-white/10 px-4 py-1.5 text-sm hover:bg-white/20">Ajouter la saison</button>
          </form>
        </section>
      )}
    </div>
  );
}
