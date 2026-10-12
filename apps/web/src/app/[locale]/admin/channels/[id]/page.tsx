import { daysUntilExpiry, pickText } from '@chouf/shared';
import { notFound } from 'next/navigation';
import { ChannelForm } from '@/components/admin/ChannelForm';
import { HealthBadge, INCIDENT_LABEL } from '@/components/admin/HealthBadge';
import { LiveRefresh } from '@/components/admin/LiveRefresh';
import { SourceForm } from '@/components/admin/SourceForm';
import { deleteChannelAction, deleteSourceAction, toggleSourceAction } from '@/server/actions/live-admin';
import { env } from '@/server/env';
import { createUserClient } from '@/server/supabase';

export const dynamic = 'force-dynamic';

const fmt = new Intl.DateTimeFormat('fr-TN', { dateStyle: 'short', timeStyle: 'medium' });
const today = () => new Date().toISOString().slice(0, 10);

export default async function EditChannel({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const db = await createUserClient();
  const [{ data: channel }, { data: sources }, { data: incidents }] = await Promise.all([
    db.from('channels').select('*').eq('id', id).maybeSingle(),
    db.from('channel_sources').select('*').eq('channel_id', id).order('priority'),
    db.from('source_incidents').select('*').eq('channel_id', id).order('started_at', { ascending: false }).limit(30),
  ]);
  if (!channel) notFound();
  const sourceIds = (sources ?? []).map((s) => s.id);
  const { data: checks } = sourceIds.length
    ? await db.from('source_health_checks').select('source_id, checked_at, ok, latency_ms, bitrate_kbps, error').in('source_id', sourceIds).order('checked_at', { ascending: false }).limit(40 * sourceIds.length)
    : { data: [] };
  const checksBySource = new Map<string, NonNullable<typeof checks>>();
  for (const c of checks ?? []) checksBySource.set(c.source_id, [...(checksBySource.get(c.source_id) ?? []), c].slice(0, 40));
  const labelOf = (sid: string | null) => (sources ?? []).find((s) => s.id === sid)?.label ?? '—';

  return (
    <div className="space-y-8">
      <LiveRefresh tables={['channel_sources', 'source_incidents']} supabaseUrl={env().NEXT_PUBLIC_SUPABASE_URL} supabaseAnonKey={env().NEXT_PUBLIC_SUPABASE_ANON_KEY} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{pickText(channel.name, 'fr')}</h1>
        <form action={deleteChannelAction}>
          <input type="hidden" name="id" value={channel.id} />
          <button className="text-sm text-red-400 hover:text-red-300">Supprimer la chaîne</button>
        </form>
      </div>
      <ChannelForm channel={channel} assetsBaseUrl={env().VOD_BASE_URL} />

      <section className="space-y-4">
        <h2 className="text-xl font-bold">Sources et santé</h2>
        {(sources ?? []).map((s) => {
          const history = checksBySource.get(s.id) ?? [];
          const days = daysUntilExpiry(s.license_info, today());
          const isActive = channel.active_source_id === s.id;
          return (
            <div key={s.id} className={`space-y-3 rounded-lg border p-5 ${isActive ? 'border-emerald-700 bg-emerald-950/20' : 'border-line bg-panel'}`}>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="font-semibold">P{s.priority} · {s.label}</h3>
                <HealthBadge health={s.health} />
                {isActive && <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-xs font-bold">EN DIFFUSION</span>}
                {!s.enabled && <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs">désactivée</span>}
                <span className={`text-xs ${days < 0 ? 'text-red-400' : days <= 30 ? 'text-amber-400' : 'text-muted'}`}>
                  Licence {s.license_info.holder} · {s.license_info.agreement_ref} · {days < 0 ? 'expirée' : `expire dans ${days} j`} · {s.license_info.territories.join(', ')}
                </span>
                <span className="ms-auto flex gap-3 text-xs">
                  <form action={toggleSourceAction}>
                    <input type="hidden" name="id" value={s.id} /><input type="hidden" name="channel_id" value={channel.id} /><input type="hidden" name="enabled" value={String(!s.enabled)} />
                    <button className="text-muted hover:text-white">{s.enabled ? 'Désactiver' : 'Activer'}</button>
                  </form>
                  <form action={deleteSourceAction}>
                    <input type="hidden" name="id" value={s.id} /><input type="hidden" name="channel_id" value={channel.id} />
                    <button className="text-red-400">Supprimer</button>
                  </form>
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-muted">
                <span>Dernier contrôle : {s.last_checked_at ? fmt.format(new Date(s.last_checked_at)) : '—'}</span>
                <span>Latence : {s.last_latency_ms ?? '—'} ms</span>
                <span>Débit : {s.last_bitrate_kbps ? `${s.last_bitrate_kbps} kb/s` : '—'}</span>
                <span>Échecs consécutifs : {s.consecutive_failures}</span>
                {s.last_error && <span className="text-red-400">{s.last_error}</span>}
              </div>
              {history.length > 0 && (
                <div className="flex items-end gap-px" title="40 derniers contrôles (le plus récent à droite)">
                  {[...history].reverse().map((c, i) => (
                    <span key={i} title={`${fmt.format(new Date(c.checked_at))} · ${c.ok ? `${c.latency_ms} ms` : c.error ?? 'échec'}`} className={`h-4 w-2 rounded-sm ${c.ok ? (c.latency_ms && c.latency_ms > 3000 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-red-500'}`} />
                  ))}
                </div>
              )}
              <details>
                <summary className="cursor-pointer text-sm text-muted">Modifier la source et sa licence</summary>
                <div className="mt-3"><SourceForm channelId={channel.id} source={s} /></div>
              </details>
            </div>
          );
        })}
        <details className="rounded-lg border border-dashed border-line p-5" open={(sources ?? []).length === 0}>
          <summary className="cursor-pointer font-semibold">+ Ajouter une source</summary>
          <div className="mt-4"><SourceForm channelId={channel.id} nextPriority={((sources ?? []).at(-1)?.priority ?? 0) + 1} /></div>
        </details>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Incidents récents</h2>
        {!incidents?.length ? (
          <p className="text-sm text-muted">Aucun incident.</p>
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line text-sm">
            {incidents.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-3 px-4 py-2">
                <span className={`w-2 h-2 rounded-full ${i.resolved_at ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="font-medium">{INCIDENT_LABEL[i.kind] ?? i.kind}</span>
                <span className="text-muted">{labelOf(i.source_id)}</span>
                <span className="ms-auto text-xs text-muted">{fmt.format(new Date(i.started_at))}{i.resolved_at ? ` → ${fmt.format(new Date(i.resolved_at))}` : ' · en cours'}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
