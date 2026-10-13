// Nightly EPG import: one XMLTV fetch per distinct URL, programmes replaced per channel.
import { type XmltvProgramme, parseXmltv, selectProgrammes } from '@chouf/shared';
import type { Logger } from 'pino';

export interface EpgRepo {
  channelsWithEpg(): Promise<{ id: string; slug: string; epg_url: string; epg_channel_id: string }[]>;
  /** Replaces the channel's programmes inside [from, to) with `rows`. */
  replacePrograms(channelId: string, from: string, to: string, rows: XmltvProgramme[]): Promise<void>;
  markUpdated(channelId: string, at: string): Promise<void>;
}

export const EPG_WINDOW = { pastHours: 6, futureDays: 8 } as const;

export function epgWindow(nowMs: number): { from: string; to: string } {
  return {
    from: new Date(nowMs - EPG_WINDOW.pastHours * 3_600_000).toISOString(),
    to: new Date(nowMs + EPG_WINDOW.futureDays * 86_400_000).toISOString(),
  };
}

export async function importEpg(repo: EpgRepo, log: Logger, fetchImpl: typeof fetch = fetch, now: () => number = Date.now): Promise<{ channels: number; programmes: number; failures: number }> {
  const channels = await repo.channelsWithEpg();
  const byUrl = new Map<string, typeof channels>();
  for (const c of channels) byUrl.set(c.epg_url, [...(byUrl.get(c.epg_url) ?? []), c]);

  let programmes = 0;
  let failures = 0;
  let done = 0;
  const { from, to } = epgWindow(now());
  for (const [url, group] of byUrl) {
    let xml: string;
    try {
      const res = await fetchImpl(url, { signal: AbortSignal.timeout(30_000), headers: { 'User-Agent': 'Chouf-EPG/1.0', Accept: 'application/xml,text/xml' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      xml = await res.text();
    } catch (err) {
      failures += group.length;
      log.error({ url, err: err instanceof Error ? err.message : String(err) }, 'EPG fetch failed');
      continue;
    }
    const doc = parseXmltv(xml);
    for (const channel of group) {
      const rows = selectProgrammes(doc, channel.epg_channel_id, from, to);
      if (rows.length === 0) {
        failures++;
        log.warn({ channel: channel.slug, epgChannelId: channel.epg_channel_id, known: doc.channels.map((c) => c.id).slice(0, 20) }, 'no programmes for channel in XMLTV');
        continue;
      }
      await repo.replacePrograms(channel.id, from, to, rows);
      await repo.markUpdated(channel.id, new Date(now()).toISOString());
      programmes += rows.length;
      done++;
    }
  }
  log.info({ channels: done, programmes, failures }, 'EPG import finished');
  return { channels: done, programmes, failures };
}
