import { pickText } from '@chouf/shared';
import { LiveRefresh } from '@/components/admin/LiveRefresh';
import { Link } from '@/i18n/navigation';
import { env } from '@/server/env';
import { createUserClient } from '@/server/supabase';

export const dynamic = 'force-dynamic';

const STATUS: Record<string, { label: string; cls: string }> = {
  scheduled: { label: 'Programmé', cls: 'text-muted' },
  live: { label: '● EN DIRECT', cls: 'text-red-400 font-bold' },
  ended: { label: 'Terminé', cls: 'text-white/60' },
};
const fmt = new Intl.DateTimeFormat('fr-TN', { dateStyle: 'medium', timeStyle: 'short' });

export default async function AdminLiveEvents() {
  const db = await createUserClient();
  const { data: events } = await db.from('live_events').select('id, slug, name, status, published, scheduled_at, started_at, replay_asset_id').order('created_at', { ascending: false });
  return (
    <div>
      <LiveRefresh tables={['live_events']} supabaseUrl={env().NEXT_PUBLIC_SUPABASE_URL} supabaseAnonKey={env().NEXT_PUBLIC_SUPABASE_ANON_KEY} />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Événements live</h1>
        <Link href="/admin/live/new" locale="fr" className="rounded-md bg-brand px-4 py-2 text-sm font-semibold hover:bg-brand-dark">+ Nouvel événement</Link>
      </div>
      <table className="w-full overflow-hidden rounded-lg border border-line text-sm">
        <thead className="bg-panel text-left text-muted"><tr><th className="p-3">Événement</th><th className="p-3">Statut</th><th className="p-3">Visibilité</th><th className="p-3">Début</th><th className="p-3">Replay</th></tr></thead>
        <tbody className="divide-y divide-line">
          {(events ?? []).map((e) => (
            <tr key={e.id} className="hover:bg-panel/60">
              <td className="p-3"><Link href={`/admin/live/${e.id}`} locale="fr" className="font-semibold hover:underline">{pickText(e.name, 'fr')}</Link><div className="text-xs text-muted">live/{e.slug}</div></td>
              <td className={`p-3 ${STATUS[e.status]?.cls}`}>{STATUS[e.status]?.label}</td>
              <td className="p-3">{e.published ? 'Publié' : <span className="text-muted">Brouillon</span>}</td>
              <td className="p-3 text-muted">{e.started_at ? fmt.format(new Date(e.started_at)) : e.scheduled_at ? `prévu ${fmt.format(new Date(e.scheduled_at))}` : '—'}</td>
              <td className="p-3">{e.replay_asset_id ? '✓' : '—'}</td>
            </tr>
          ))}
          {!events?.length && <tr><td colSpan={5} className="p-6 text-center text-muted">Aucun événement.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
