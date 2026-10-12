import { pickText } from '@chouf/shared';
import { notFound } from 'next/navigation';
import { EventForm } from '@/components/admin/EventForm';
import { LiveRefresh } from '@/components/admin/LiveRefresh';
import { Link } from '@/i18n/navigation';
import { createReplayTitleAction, deleteEventAction, endEventAction, reopenEventAction, rotateStreamKeyAction } from '@/server/actions/live-admin';
import { env } from '@/server/env';
import { createUserClient } from '@/server/supabase';

export const dynamic = 'force-dynamic';

const fmt = new Intl.DateTimeFormat('fr-TN', { dateStyle: 'medium', timeStyle: 'short' });

export default async function EditLiveEvent({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ key?: string }> }) {
  const { id } = await params;
  const { key } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const db = await createUserClient();
  const { data: event } = await db.from('live_events').select('*').eq('id', id).maybeSingle();
  if (!event) notFound();
  const { data: replay } = event.replay_asset_id ? await db.from('media_assets').select('id, status, progress, error').eq('id', event.replay_asset_id).maybeSingle() : { data: null };
  const { data: replayTitle } = event.replay_asset_id ? await db.from('titles').select('id, slug, status').eq('asset_id', event.replay_asset_id).maybeSingle() : { data: null };
  const e = env();
  const code = 'rounded bg-ink px-2 py-1 font-mono text-xs select-all';

  return (
    <div className="space-y-8">
      <LiveRefresh tables={['live_events', 'media_assets']} supabaseUrl={e.NEXT_PUBLIC_SUPABASE_URL} supabaseAnonKey={e.NEXT_PUBLIC_SUPABASE_ANON_KEY} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{pickText(event.name, 'fr')}</h1>
        <div className="flex items-center gap-4 text-sm">
          {event.status === 'live' && (
            <form action={endEventAction}><input type="hidden" name="id" value={event.id} /><button className="rounded-md bg-red-700 px-3 py-1.5 font-semibold hover:bg-red-600">■ Terminer l’événement</button></form>
          )}
          {event.status === 'ended' && (
            <form action={reopenEventAction}><input type="hidden" name="id" value={event.id} /><button className="text-muted hover:text-white">Réouvrir (reprogrammer)</button></form>
          )}
          <form action={deleteEventAction}><input type="hidden" name="id" value={event.id} /><button className="text-red-400 hover:text-red-300">Supprimer</button></form>
        </div>
      </div>

      {key && (
        <div className="rounded-lg border border-amber-700 bg-amber-950/30 p-4 text-sm">
          <p className="mb-2 font-semibold text-amber-300">Clé de stream — copiez-la maintenant, elle ne sera plus affichée.</p>
          <code className={`${code} text-base`}>{key}</code>
        </div>
      )}

      <section className="grid gap-4 rounded-lg border border-line bg-panel p-5 text-sm sm:grid-cols-2">
        <div>
          <h2 className="mb-2 font-semibold">État</h2>
          <p>
            {event.status === 'live' ? <span className="font-bold text-red-400">● EN DIRECT</span> : event.status === 'ended' ? 'Terminé' : 'Programmé'}
            {event.started_at && <span className="text-muted"> · début {fmt.format(new Date(event.started_at))}</span>}
            {event.ended_at && <span className="text-muted"> · fin {fmt.format(new Date(event.ended_at))}</span>}
          </p>
          <p className="mt-1 text-muted">Le statut passe à « en direct » dès que l’encodeur publie, et à « terminé » deux minutes après la fin de la publication (délai de tolérance aux coupures).</p>
          <p className="mt-2"><Link href={`/live/event/${event.slug}`} className="underline">Page publique</Link></p>
        </div>
        <div className="space-y-2">
          <h2 className="font-semibold">Ingestion (OBS, vMix, encodeur)</h2>
          <p>RTMP — serveur : <code className={code} dir="ltr">{e.LIVE_INGEST_RTMP_URL}/{event.stream_path}</code></p>
          <p>RTMP — clé : <code className={code}>la clé de stream</code> (champ « Stream key » / « Clé »)</p>
          <p>SRT : <code className={code} dir="ltr">{e.LIVE_INGEST_SRT_URL}?streamid=publish:{event.stream_path}:chouf:&lt;clé&gt;</code></p>
          <form action={rotateStreamKeyAction}><input type="hidden" name="id" value={event.id} /><button className="text-xs text-amber-400 hover:text-amber-300">Régénérer la clé (l’ancienne cesse de fonctionner)</button></form>
        </div>
      </section>

      <EventForm event={event} assetsBaseUrl={e.VOD_BASE_URL} />

      {event.status === 'ended' && (
        <section className="rounded-lg border border-line bg-panel p-5 text-sm">
          <h2 className="mb-2 font-semibold">Replay</h2>
          {!event.record ? (
            <p className="text-muted">L’enregistrement était désactivé pour cet événement.</p>
          ) : !replay ? (
            <p className="text-muted">Le replay est en préparation (concaténation de l’enregistrement)…</p>
          ) : (
            <div className="space-y-2">
              <p>Vidéo : <span className={replay.status === 'ready' ? 'text-emerald-400' : replay.status === 'failed' ? 'text-red-400' : 'text-sky-400'}>{replay.status}{replay.status === 'processing' ? ` ${replay.progress} %` : ''}</span>{replay.error && <span className="text-red-400"> — {replay.error}</span>}</p>
              {replayTitle ? (
                <p>Titre : <Link href={`/admin/titles/${replayTitle.id}`} locale="fr" className="underline">{replayTitle.slug}</Link> ({replayTitle.status})</p>
              ) : (
                <form action={createReplayTitleAction}><input type="hidden" name="id" value={event.id} /><button className="rounded bg-white/10 px-3 py-1.5 hover:bg-white/20">Créer un titre VOD à partir du replay</button></form>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
