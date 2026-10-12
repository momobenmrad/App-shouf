// Source monitor: probes every enabled licensed source, tracks health with hysteresis, switches
// each channel to its best source, logs incidents and raises alerts.
import {
  type ChannelSourceRow,
  type IncidentKind,
  MONITOR_RULES,
  type ProbeObservation,
  type SourceCandidate,
  type SourceChange,
  decideActiveSource,
  firstVariantUrl,
  inspectMediaPlaylist,
  isMasterPlaylist,
  judgeProbe,
  nextHealth,
} from '@chouf/shared';
import type { Logger } from 'pino';
import type { Alerter } from './alerts';

const PROBE_TIMEOUT_MS = 5_000;

export async function probeSource(url: string, fetchImpl: typeof fetch = fetch): Promise<ProbeObservation> {
  const started = Date.now();
  const fail = (error: string, httpStatus = 0): ProbeObservation => ({ httpStatus, latencyMs: Date.now() - started, playable: false, mediaSequence: null, ended: false, bitrateKbps: null, error });
  try {
    const get = (u: string) => fetchImpl(u, { signal: AbortSignal.timeout(PROBE_TIMEOUT_MS), headers: { 'User-Agent': 'Chouf-Monitor/1.0' } });
    let res = await get(url);
    const latencyMs = Date.now() - started;
    if (!res.ok) return fail(`HTTP ${res.status}`, res.status);
    let text = await res.text();
    let playlistUrl = url;
    if (!text.startsWith('#EXTM3U')) return fail('not an HLS playlist', res.status);
    if (isMasterPlaylist(text)) {
      const variant = firstVariantUrl(text, url);
      if (!variant) return fail('master playlist without variants', res.status);
      res = await get(variant);
      if (!res.ok) return fail(`variant HTTP ${res.status}`, res.status);
      text = await res.text();
      playlistUrl = variant;
    }
    const info = inspectMediaPlaylist(text, playlistUrl);
    let bitrateKbps: number | null = null;
    if (info.lastSegmentUrl && info.lastSegmentDuration) {
      try {
        const seg = await get(info.lastSegmentUrl);
        const bytes = seg.ok ? await readUpTo(seg, MONITOR_RULES.bitrateSampleBytes) : 0;
        const declared = Number(seg.headers.get('content-length'));
        const size = declared > 0 ? declared : bytes;
        if (size > 0) bitrateKbps = Math.round((size * 8) / info.lastSegmentDuration / 1000);
      } catch {
        // bitrate is informational only
      }
    }
    return { httpStatus: 200, latencyMs, playable: info.segmentCount > 0, mediaSequence: info.mediaSequence, ended: info.ended, bitrateKbps, error: info.segmentCount > 0 ? null : 'playlist without segments' };
  } catch (err) {
    return fail(err instanceof Error && err.name === 'TimeoutError' ? 'timeout' : err instanceof Error ? err.message : String(err));
  }
}

async function readUpTo(res: Response, cap: number): Promise<number> {
  if (!res.body) return 0;
  const reader = res.body.getReader();
  let total = 0;
  while (total < cap) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
  }
  await reader.cancel().catch(() => undefined);
  return total;
}

export type MonitoredSource = Pick<
  ChannelSourceRow,
  'id' | 'channel_id' | 'label' | 'url' | 'priority' | 'enabled' | 'health' | 'consecutive_failures' | 'consecutive_successes' | 'license_info' | 'last_media_sequence' | 'last_sequence_change_at' | 'last_error'
>;

export interface MonitoredChannel {
  id: string;
  slug: string;
  status: 'active' | 'inactive';
  active_source_id: string | null;
}

export interface MonitorRepo {
  listSources(): Promise<MonitoredSource[]>;
  listChannels(ids: string[]): Promise<MonitoredChannel[]>;
  saveProbe(sourceId: string, patch: Partial<ChannelSourceRow>, check: { ok: boolean; http_status: number | null; latency_ms: number; bitrate_kbps: number | null; error: string | null }): Promise<void>;
  setActiveSource(channelId: string, sourceId: string | null): Promise<void>;
  openIncident(channelId: string, sourceId: string | null, kind: IncidentKind, details: Record<string, unknown>): Promise<void>;
  /** Resolves open incidents of these kinds for the source (or the channel when sourceId is null). */
  resolveIncidents(channelId: string, sourceId: string | null, kinds: IncidentKind[]): Promise<number>;
  hasOpenIncident(channelId: string, sourceId: string | null, kind: IncidentKind): Promise<boolean>;
}

export interface MonitorDeps {
  repo: MonitorRepo;
  alert: Alerter;
  log: Logger;
  fetchImpl?: typeof fetch;
  now?: () => number;
  concurrency?: number;
}

export async function runMonitorCycle(deps: MonitorDeps): Promise<{ probed: number; changes: number }> {
  const now = deps.now ?? Date.now;
  const sources = await deps.repo.listSources();
  const today = new Date(now()).toISOString().slice(0, 10);
  const updated = new Map<string, MonitoredSource>();

  // 1. Probe every enabled source.
  let index = 0;
  await Promise.all(
    Array.from({ length: Math.min(deps.concurrency ?? 8, sources.length) }, async () => {
      while (index < sources.length) {
        const source = sources[index++]!;
        if (!source.enabled) continue;
        const obs = await probeSource(source.url, deps.fetchImpl);
        const verdict = judgeProbe(obs, { lastMediaSequence: source.last_media_sequence, lastSequenceChangeAt: source.last_sequence_change_at ? Date.parse(source.last_sequence_change_at) : null }, now());
        const health = nextHealth(source, verdict);
        const patch: Partial<ChannelSourceRow> = {
          ...health,
          last_checked_at: new Date(now()).toISOString(),
          last_media_sequence: verdict.lastMediaSequence,
          last_sequence_change_at: verdict.lastSequenceChangeAt ? new Date(verdict.lastSequenceChangeAt).toISOString() : null,
          last_latency_ms: obs.latencyMs,
          last_bitrate_kbps: obs.bitrateKbps,
          last_error: verdict.error,
        };
        await deps.repo.saveProbe(source.id, patch, { ok: verdict.ok, http_status: obs.httpStatus || null, latency_ms: obs.latencyMs, bitrate_kbps: obs.bitrateKbps, error: verdict.error });
        const next = { ...source, ...patch } as MonitoredSource;
        updated.set(source.id, next);

        // Per-source incidents (down / degraded), de-duplicated while open.
        if (next.health === 'down' && source.health !== 'down') {
          await deps.repo.resolveIncidents(source.channel_id, source.id, ['degraded']);
          if (!(await deps.repo.hasOpenIncident(source.channel_id, source.id, 'down'))) {
            await deps.repo.openIncident(source.channel_id, source.id, 'down', { error: verdict.error });
          }
        } else if (next.health === 'degraded' && source.health === 'healthy') {
          if (!(await deps.repo.hasOpenIncident(source.channel_id, source.id, 'degraded'))) {
            await deps.repo.openIncident(source.channel_id, source.id, 'degraded', { error: verdict.error });
          }
        } else if (next.health === 'healthy' && source.health !== 'healthy') {
          await deps.repo.resolveIncidents(source.channel_id, source.id, ['down', 'degraded']);
        }
      }
    }),
  );

  // 2. Pick the active source of each channel.
  const byChannel = new Map<string, MonitoredSource[]>();
  for (const s of sources) byChannel.set(s.channel_id, [...(byChannel.get(s.channel_id) ?? []), updated.get(s.id) ?? s]);
  const channels = await deps.repo.listChannels([...byChannel.keys()]);
  let changes = 0;
  for (const channel of channels) {
    const candidates = (byChannel.get(channel.id) ?? []) as SourceCandidate[];
    const decision = decideActiveSource(candidates, channel.active_source_id, today);
    if (decision.change === null) continue;
    changes++;
    await deps.repo.setActiveSource(channel.id, decision.activeSourceId);
    await handleChange(deps, channel, candidates, decision.change, decision.activeSourceId);
  }
  return { probed: updated.size, changes };
}

async function handleChange(deps: MonitorDeps, channel: MonitoredChannel, sources: SourceCandidate[], change: Exclude<SourceChange, null>, activeId: string | null) {
  const label = (id: string | null) => (sources.find((s) => s.id === id) as MonitoredSource | undefined)?.label ?? id ?? '—';
  const details = { from: channel.active_source_id, to: activeId };
  switch (change) {
    case 'failover':
      await deps.repo.openIncident(channel.id, activeId, 'failover', details);
      await deps.alert.send(`Chaîne « ${channel.slug} » : bascule vers la source « ${label(activeId)} » (« ${label(channel.active_source_id)} » indisponible).`);
      break;
    case 'failback':
      await deps.repo.openIncident(channel.id, activeId, 'failback', details);
      await deps.repo.resolveIncidents(channel.id, null, ['all_sources_down']);
      deps.log.info({ channel: channel.slug, to: label(activeId) }, 'failback');
      break;
    case 'all_sources_down':
      if (!(await deps.repo.hasOpenIncident(channel.id, null, 'all_sources_down'))) {
        await deps.repo.openIncident(channel.id, null, 'all_sources_down', details);
        await deps.alert.send(`🔴 Chaîne « ${channel.slug} » hors service : aucune source disponible.`);
      }
      break;
    case 'restored':
      await deps.repo.resolveIncidents(channel.id, null, ['all_sources_down']);
      await deps.alert.send(`Chaîne « ${channel.slug} » rétablie sur la source « ${label(activeId)} ».`);
      break;
  }
}
