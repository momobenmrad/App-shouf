import { createServiceClient } from '@/server/supabase';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const db = createServiceClient();
  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString();
  const count = (q: PromiseLike<{ count: number | null }>) => Promise.resolve(q).then((r) => r.count ?? 0);
  const [published, drafts, ready, processing, failed, subs, users, paid, channelsActive, sourcesDown, openIncidents, liveNow] = await Promise.all([
    count(db.from('titles').select('id', { count: 'exact', head: true }).eq('status', 'published')),
    count(db.from('titles').select('id', { count: 'exact', head: true }).eq('status', 'draft')),
    count(db.from('media_assets').select('id', { count: 'exact', head: true }).eq('status', 'ready')),
    count(db.from('media_assets').select('id', { count: 'exact', head: true }).in('status', ['queued', 'processing'])),
    count(db.from('media_assets').select('id', { count: 'exact', head: true }).eq('status', 'failed')),
    count(db.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active').gt('current_period_end', new Date().toISOString())),
    count(db.from('profiles').select('id', { count: 'exact', head: true })),
    db.from('payments').select('amount_millimes').eq('status', 'succeeded').gte('paid_at', monthStart).then((r) => (r.data ?? []).reduce((s, p) => s + p.amount_millimes, 0)),
    count(db.from('channels').select('id', { count: 'exact', head: true }).eq('status', 'active')),
    count(db.from('channel_sources').select('id', { count: 'exact', head: true }).eq('enabled', true).eq('health', 'down')),
    count(db.from('source_incidents').select('id', { count: 'exact', head: true }).is('resolved_at', null)),
    count(db.from('live_events').select('id', { count: 'exact', head: true }).eq('status', 'live')),
  ]);
  const stats = [
    ['Titres publiés', published],
    ['Brouillons', drafts],
    ['Vidéos prêtes', ready],
    ['En transcodage', processing],
    ['Échecs', failed],
    ['Abonnés actifs', subs],
    ['Comptes', users],
    ['Encaissé ce mois (TND)', (paid / 1000).toFixed(3)],
    ['Chaînes actives', channelsActive],
    ['Sources hors service', sourcesDown],
    ['Incidents ouverts', openIncidents],
    ['Événements en direct', liveNow],
  ] as const;
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Tableau de bord</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-line bg-panel p-4">
            <p className="text-sm text-muted">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${['Échecs', 'Sources hors service', 'Incidents ouverts'].includes(label) && Number(value) > 0 ? 'text-red-400' : ''}`}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
