import type { IncidentKind, Json } from '@chouf/shared';
import type { ServiceClient } from './db';
import type { MonitorRepo } from './monitor';

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export function createMonitorRepo(db: ServiceClient): MonitorRepo {
  return {
    async listSources() {
      const { data, error } = await db
        .from('channel_sources')
        .select('id, channel_id, label, url, priority, enabled, health, consecutive_failures, consecutive_successes, license_info, last_media_sequence, last_sequence_change_at, last_error')
        .eq('enabled', true);
      fail(error);
      return data ?? [];
    },
    async listChannels(ids) {
      if (ids.length === 0) return [];
      const { data, error } = await db.from('channels').select('id, slug, status, active_source_id').in('id', ids);
      fail(error);
      return data ?? [];
    },
    async saveProbe(sourceId, patch, check) {
      fail((await db.from('channel_sources').update(patch).eq('id', sourceId)).error);
      fail((await db.from('source_health_checks').insert({ source_id: sourceId, ...check })).error);
    },
    async setActiveSource(channelId, sourceId) {
      fail((await db.from('channels').update({ active_source_id: sourceId }).eq('id', channelId)).error);
    },
    async openIncident(channelId, sourceId, kind, details) {
      fail((await db.from('source_incidents').insert({ channel_id: channelId, source_id: sourceId, kind, details: details as Json })).error);
    },
    async resolveIncidents(channelId, sourceId, kinds) {
      let q = db.from('source_incidents').update({ resolved_at: new Date().toISOString() }).eq('channel_id', channelId).in('kind', kinds).is('resolved_at', null);
      q = sourceId ? q.eq('source_id', sourceId) : q.is('source_id', null);
      const { data, error } = await q.select('id');
      fail(error);
      return data?.length ?? 0;
    },
    async hasOpenIncident(channelId, sourceId, kind) {
      let q = db.from('source_incidents').select('id', { count: 'exact', head: true }).eq('channel_id', channelId).eq('kind', kind).is('resolved_at', null);
      q = sourceId ? q.eq('source_id', sourceId) : q.is('source_id', null);
      const { count, error } = await q;
      fail(error);
      return (count ?? 0) > 0;
    },
  };
}

export async function pruneHealthChecks(db: ServiceClient, days = 30): Promise<void> {
  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString();
  fail((await db.from('source_health_checks').delete().lt('checked_at', cutoff)).error);
}
