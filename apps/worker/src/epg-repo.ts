import type { ServiceClient } from './db';
import type { EpgRepo } from './epg';

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export function createEpgRepo(db: ServiceClient): EpgRepo {
  return {
    async channelsWithEpg() {
      const { data, error } = await db.from('channels').select('id, slug, epg_url, epg_channel_id').not('epg_url', 'is', null).not('epg_channel_id', 'is', null);
      fail(error);
      return (data ?? []) as { id: string; slug: string; epg_url: string; epg_channel_id: string }[];
    },
    async replacePrograms(channelId, from, to, rows) {
      fail((await db.from('epg_programs').delete().eq('channel_id', channelId).gte('start_at', from).lt('start_at', to)).error);
      for (let i = 0; i < rows.length; i += 500) {
        fail(
          (
            await db.from('epg_programs').upsert(
              rows.slice(i, i + 500).map((p) => ({ channel_id: channelId, start_at: p.start, end_at: p.end, title: p.title, description: p.description, category: p.category, rating: p.rating })),
              { onConflict: 'channel_id,start_at' },
            )
          ).error,
        );
      }
      // Drop stale programmes older than the window (keeps the table small).
      fail((await db.from('epg_programs').delete().eq('channel_id', channelId).lt('end_at', from)).error);
    },
    async markUpdated(channelId, at) {
      fail((await db.from('channels').update({ epg_updated_at: at }).eq('id', channelId)).error);
    },
  };
}
