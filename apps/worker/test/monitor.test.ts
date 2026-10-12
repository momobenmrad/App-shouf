import type { IncidentKind } from '@chouf/shared';
import pino from 'pino';
import { describe, expect, it, vi } from 'vitest';
import type { Alerter } from '../src/alerts';
import { type MonitorRepo, type MonitoredChannel, type MonitoredSource, probeSource, runMonitorCycle } from '../src/monitor';

const CH = '30000000-0000-0000-0000-000000000001';
const license = { holder: 'TT', agreement_ref: 'A', expires_at: '2030-01-01', territories: ['TN'] };

function source(id: string, priority: number, url: string): MonitoredSource {
  return { id, channel_id: CH, label: id, url, priority, enabled: true, health: 'unknown', consecutive_failures: 0, consecutive_successes: 0, license_info: license, last_media_sequence: null, last_sequence_change_at: null, last_error: null };
}

/** In-memory world: sources, channel, incidents, plus a fake HLS origin whose sequence advances. */
function world() {
  const sources = new Map<string, MonitoredSource>([
    ['primary', source('primary', 1, 'https://a.example/live.m3u8')],
    ['backup', source('backup', 2, 'https://b.example/live.m3u8')],
  ]);
  const channel: MonitoredChannel = { id: CH, slug: 'watania', status: 'active', active_source_id: 'primary' };
  const incidents: { source_id: string | null; kind: IncidentKind; resolved: boolean }[] = [];
  const checks: { sourceId: string; ok: boolean }[] = [];
  const online = new Set(['a.example', 'b.example']);
  let seq = 100;
  const fetchImpl = vi.fn(async (input: string | URL | Request) => {
    const url = new URL(String(input));
    if (!online.has(url.hostname)) return new Response('down', { status: 503 });
    if (url.pathname.endsWith('.m3u8')) {
      return new Response(`#EXTM3U\n#EXT-X-TARGETDURATION:6\n#EXT-X-MEDIA-SEQUENCE:${seq}\n#EXTINF:6.0,\nseg${seq}.ts\n`, { status: 200 });
    }
    return new Response(new Uint8Array(150_000), { status: 200, headers: { 'content-length': '150000' } });
  }) as unknown as typeof fetch;
  const repo: MonitorRepo = {
    listSources: async () => [...sources.values()],
    listChannels: async () => [channel],
    saveProbe: async (id, patch, check) => {
      sources.set(id, { ...sources.get(id)!, ...patch } as MonitoredSource);
      checks.push({ sourceId: id, ok: check.ok });
    },
    setActiveSource: async (_c, id) => void (channel.active_source_id = id),
    openIncident: async (_c, source_id, kind) => void incidents.push({ source_id, kind, resolved: false }),
    resolveIncidents: async (_c, source_id, kinds) => {
      let n = 0;
      for (const i of incidents) if (!i.resolved && i.source_id === source_id && kinds.includes(i.kind)) (i.resolved = true), n++;
      return n;
    },
    hasOpenIncident: async (_c, source_id, kind) => incidents.some((i) => !i.resolved && i.source_id === source_id && i.kind === kind),
  };
  const alerts: string[] = [];
  const alert: Alerter = { send: async (m) => void alerts.push(m) };
  let now = 1_800_000_000_000;
  const cycle = async () => {
    now += 30_000;
    seq++;
    return runMonitorCycle({ repo, alert, log: pino({ level: 'silent' }), fetchImpl, now: () => now });
  };
  return { sources, channel, incidents, checks, alerts, online, cycle, fetchImpl, stall: () => void seq-- };
}

describe('probeSource', () => {
  it('measures a live media playlist and estimates the bitrate from the last segment', async () => {
    const w = world();
    const obs = await probeSource('https://a.example/live.m3u8', w.fetchImpl);
    expect(obs).toMatchObject({ httpStatus: 200, playable: true, mediaSequence: 100, ended: false, bitrateKbps: 200, error: null });
  });
  it('reports unreachable sources', async () => {
    const w = world();
    w.online.delete('a.example');
    expect(await probeSource('https://a.example/live.m3u8', w.fetchImpl)).toMatchObject({ httpStatus: 503, playable: false, error: 'HTTP 503' });
  });
});

describe('runMonitorCycle', () => {
  it('keeps a healthy primary active and records checks', async () => {
    const w = world();
    const r = await w.cycle();
    expect(r).toEqual({ probed: 2, changes: 0 });
    expect(w.sources.get('primary')!.health).toBe('healthy');
    expect(w.channel.active_source_id).toBe('primary');
    expect(w.checks.filter((c) => c.ok)).toHaveLength(2);
    expect(w.incidents).toEqual([]);
  });

  it('fails over after 3 failures, logs incidents and alerts, then fails back after 5 good checks', async () => {
    const w = world();
    await w.cycle();
    w.online.delete('a.example');
    await w.cycle();
    await w.cycle();
    expect(w.channel.active_source_id).toBe('primary'); // degraded, not yet down
    expect(w.sources.get('primary')!.health).toBe('degraded');
    await w.cycle();
    expect(w.sources.get('primary')!.health).toBe('down');
    expect(w.channel.active_source_id).toBe('backup');
    expect(w.incidents.map((i) => i.kind)).toEqual(['degraded', 'down', 'failover']);
    expect(w.incidents.find((i) => i.kind === 'degraded')!.resolved).toBe(true);
    expect(w.alerts.some((a) => a.includes('bascule vers la source « backup »'))).toBe(true);

    w.online.add('a.example');
    for (let i = 0; i < 4; i++) await w.cycle();
    expect(w.channel.active_source_id).toBe('backup');
    await w.cycle();
    expect(w.sources.get('primary')!.health).toBe('healthy');
    expect(w.channel.active_source_id).toBe('primary');
    expect(w.incidents.find((i) => i.kind === 'down')!.resolved).toBe(true);
    expect(w.incidents.at(-1)!.kind).toBe('failback');
  });

  it('declares the channel out of service when every source is down, once, and restores it', async () => {
    const w = world();
    await w.cycle();
    w.online.clear();
    for (let i = 0; i < 4; i++) await w.cycle();
    expect(w.channel.active_source_id).toBeNull();
    expect(w.incidents.filter((i) => i.kind === 'all_sources_down')).toHaveLength(1);
    expect(w.alerts.filter((a) => a.includes('hors service'))).toHaveLength(1);
    w.online.add('b.example');
    await w.cycle(); // total outage: one good probe is enough to get back on air
    expect(w.channel.active_source_id).toBe('backup');
    expect(w.incidents.find((i) => i.kind === 'all_sources_down')!.resolved).toBe(true);
    expect(w.alerts.at(-1)).toContain('rétablie');
  });

  it('detects a frozen playlist as a failure', async () => {
    const w = world();
    await w.cycle();
    for (let i = 0; i < 5; i++) {
      w.stall(); // sequence no longer advances
      await w.cycle();
    }
    expect(w.sources.get('primary')!.last_error).toBe('playlist stalled');
    expect(w.sources.get('primary')!.health).toBe('down');
  });
});
