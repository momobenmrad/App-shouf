import { pickText } from '@chouf/shared';
import { INCIDENT_LABEL } from '@/components/admin/HealthBadge';
import { LiveRefresh } from '@/components/admin/LiveRefresh';
import { Link } from '@/i18n/navigation';
import { resolveIncidentAction } from '@/server/actions/live-admin';
import { env } from '@/server/env';
import { createUserClient } from '@/server/supabase';

export const dynamic = 'force-dynamic';

const fmt = new Intl.DateTimeFormat('fr-TN', { dateStyle: 'short', timeStyle: 'short' });

export default async function AdminIncidents() {
  const db = await createUserClient();
  const { data: incidents } = await db
    .from('source_incidents')
    .select('id, kind, started_at, resolved_at, details, channels(id, slug, name), channel_sources(label)')
    .order('resolved_at', { ascending: true, nullsFirst: true })
    .order('started_at', { ascending: false })
    .limit(200);

  return (
    <div>
      <LiveRefresh tables={['source_incidents']} supabaseUrl={env().NEXT_PUBLIC_SUPABASE_URL} supabaseAnonKey={env().NEXT_PUBLIC_SUPABASE_ANON_KEY} />
      <h1 className="mb-6 text-2xl font-bold">Journal des incidents</h1>
      <table className="w-full overflow-hidden rounded-lg border border-line text-sm">
        <thead className="bg-panel text-left text-muted">
          <tr><th className="p-3">État</th><th className="p-3">Chaîne</th><th className="p-3">Incident</th><th className="p-3">Source</th><th className="p-3">Début</th><th className="p-3">Fin</th><th className="p-3" /></tr>
        </thead>
        <tbody className="divide-y divide-line">
          {(incidents ?? []).map((i) => {
            const ch = i.channels as unknown as { id: string; slug: string; name: Record<string, string> } | null;
            const src = i.channel_sources as unknown as { label: string } | null;
            return (
              <tr key={i.id} className={i.resolved_at ? '' : 'bg-red-950/20'}>
                <td className="p-3">{i.resolved_at ? <span className="text-emerald-400">Résolu</span> : <span className="font-semibold text-red-400">En cours</span>}</td>
                <td className="p-3">{ch ? <Link href={`/admin/channels/${ch.id}`} locale="fr" className="hover:underline">{pickText(ch.name, 'fr')}</Link> : '—'}</td>
                <td className="p-3">{INCIDENT_LABEL[i.kind] ?? i.kind}<div className="text-xs text-muted">{(i.details as { error?: string } | null)?.error}</div></td>
                <td className="p-3">{src?.label ?? '—'}</td>
                <td className="p-3">{fmt.format(new Date(i.started_at))}</td>
                <td className="p-3">{i.resolved_at ? fmt.format(new Date(i.resolved_at)) : '—'}</td>
                <td className="p-3 text-end">
                  {!i.resolved_at && (
                    <form action={resolveIncidentAction}>
                      <input type="hidden" name="id" value={i.id} />
                      <button className="text-xs text-muted hover:text-white">Marquer résolu</button>
                    </form>
                  )}
                </td>
              </tr>
            );
          })}
          {!incidents?.length && <tr><td colSpan={7} className="p-6 text-center text-muted">Aucun incident enregistré.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
