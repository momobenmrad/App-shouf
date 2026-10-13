import { pickText } from '@chouf/shared';
import { HealthBadge } from '@/components/admin/HealthBadge';
import { LiveRefresh } from '@/components/admin/LiveRefresh';
import { Link } from '@/i18n/navigation';
import { env } from '@/server/env';
import { createUserClient } from '@/server/supabase';

export const dynamic = 'force-dynamic';

export default async function AdminChannels() {
  const db = await createUserClient();
  const [{ data: channels }, { data: incidents }] = await Promise.all([
    db.from('channels').select('id, slug, name, category, status, access, active_source_id, auto_disabled_reason, channel_sources!channel_sources_channel_id_fkey(id, label, priority, enabled, health, last_latency_ms)').order('sort_order'),
    db.from('source_incidents').select('channel_id').is('resolved_at', null),
  ]);
  const openByChannel = new Map<string, number>();
  for (const i of incidents ?? []) openByChannel.set(i.channel_id, (openByChannel.get(i.channel_id) ?? 0) + 1);

  return (
    <div>
      <LiveRefresh tables={['channels', 'channel_sources', 'source_incidents']} supabaseUrl={env().NEXT_PUBLIC_SUPABASE_URL} supabaseAnonKey={env().NEXT_PUBLIC_SUPABASE_ANON_KEY} />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chaînes</h1>
        <div className="flex gap-3">
          <Link href="/admin/channels/import" locale="fr" className="rounded-md border border-line px-4 py-2 text-sm hover:bg-panel">Importer une playlist M3U</Link>
          <Link href="/admin/channels/new" locale="fr" className="rounded-md bg-brand px-4 py-2 text-sm font-semibold hover:bg-brand-dark">+ Nouvelle chaîne</Link>
        </div>
      </div>
      <table className="w-full overflow-hidden rounded-lg border border-line text-sm">
        <thead className="bg-panel text-left text-muted">
          <tr><th className="p-3">Chaîne</th><th className="p-3">Statut</th><th className="p-3">Source active</th><th className="p-3">Sources</th><th className="p-3">Incidents</th></tr>
        </thead>
        <tbody className="divide-y divide-line">
          {(channels ?? []).map((c) => {
            const sources = [...c.channel_sources].sort((a, b) => a.priority - b.priority);
            const active = sources.find((s) => s.id === c.active_source_id);
            const open = openByChannel.get(c.id) ?? 0;
            return (
              <tr key={c.id} className="hover:bg-panel/60">
                <td className="p-3">
                  <Link href={`/admin/channels/${c.id}`} locale="fr" className="font-semibold hover:underline">{pickText(c.name, 'fr')}</Link>
                  <div className="text-xs text-muted">{c.slug} · {c.access === 'free' ? 'gratuit' : 'abonnés'}</div>
                </td>
                <td className="p-3">
                  {c.status === 'active' ? <span className="text-emerald-400">Active</span> : <span className="text-muted">Inactive</span>}
                  {c.auto_disabled_reason && <div className="text-xs text-amber-400">auto : {c.auto_disabled_reason}</div>}
                </td>
                <td className="p-3">{active ? `${active.label} (P${active.priority})` : <span className="text-red-400">aucune</span>}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {sources.map((s) => (
                      <span key={s.id} title={`${s.label} · P${s.priority}${s.last_latency_ms ? ` · ${s.last_latency_ms} ms` : ''}`} className={s.enabled ? '' : 'opacity-40'}>
                        <HealthBadge health={s.health} />
                      </span>
                    ))}
                    {sources.length === 0 && <span className="text-muted">—</span>}
                  </div>
                </td>
                <td className="p-3">{open > 0 ? <span className="font-semibold text-red-400">{open} ouvert{open > 1 ? 's' : ''}</span> : <span className="text-muted">0</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
