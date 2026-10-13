import type { XmltvProgramme } from '@chouf/shared';
import pino from 'pino';
import { describe, expect, it, vi } from 'vitest';
import { type EpgRepo, epgWindow, importEpg } from '../src/epg';

const NOW = Date.UTC(2026, 9, 13, 12, 0, 0);
const XML = `<tv>
<programme start="20261013110000 +0000" stop="20261013120000 +0000" channel="a"><title>Before</title></programme>
<programme start="20261013120000 +0000" stop="20261013130000 +0000" channel="a"><title>Now</title></programme>
<programme start="20261013130000 +0000" stop="20261013140000 +0000" channel="b"><title>B show</title></programme>
<programme start="20261101000000 +0000" stop="20261101010000 +0000" channel="a"><title>Too far</title></programme>
</tv>`;

function world(urlOk = true) {
  const written = new Map<string, XmltvProgramme[]>();
  const updated: string[] = [];
  const repo: EpgRepo = {
    channelsWithEpg: async () => [
      { id: 'c1', slug: 'one', epg_url: 'https://epg.example/tn.xml', epg_channel_id: 'a' },
      { id: 'c2', slug: 'two', epg_url: 'https://epg.example/tn.xml', epg_channel_id: 'b' },
      { id: 'c3', slug: 'three', epg_url: 'https://epg.example/tn.xml', epg_channel_id: 'missing' },
    ],
    replacePrograms: async (id, _f, _t, rows) => void written.set(id, rows),
    markUpdated: async (id) => void updated.push(id),
  };
  const fetchImpl = vi.fn(async () => new Response(urlOk ? XML : 'nope', { status: urlOk ? 200 : 500 })) as unknown as typeof fetch;
  return { repo, written, updated, fetchImpl };
}

describe('importEpg', () => {
  it('fetches each URL once, writes windowed programmes per channel and reports misses', async () => {
    const w = world();
    const result = await importEpg(w.repo, pino({ level: 'silent' }), w.fetchImpl, () => NOW);
    expect(w.fetchImpl).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ channels: 2, programmes: 3, failures: 1 });
    expect(w.written.get('c1')!.map((p) => p.title.fr)).toEqual(['Before', 'Now']); // "Too far" is outside the 8-day window
    expect(w.written.get('c2')).toHaveLength(1);
    expect(w.updated.sort()).toEqual(['c1', 'c2']);
  });

  it('counts every channel of a failed URL as a failure and writes nothing', async () => {
    const w = world(false);
    expect(await importEpg(w.repo, pino({ level: 'silent' }), w.fetchImpl, () => NOW)).toEqual({ channels: 0, programmes: 0, failures: 3 });
    expect(w.written.size).toBe(0);
  });

  it('computes the import window around now', () => {
    expect(epgWindow(NOW)).toEqual({ from: '2026-10-13T06:00:00.000Z', to: '2026-10-21T12:00:00.000Z' });
  });
});
