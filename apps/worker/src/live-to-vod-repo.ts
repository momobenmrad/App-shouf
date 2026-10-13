import type { ServiceClient } from './db';
import type { LiveToVodRepo } from './live-to-vod';

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export function createLiveToVodRepo(db: ServiceClient, enqueueTranscode: (assetId: string) => Promise<void>): LiveToVodRepo {
  return {
    async getEvent(id) {
      const { data, error } = await db.from('live_events').select('id, slug, record, replay_asset_id').eq('id', id).maybeSingle();
      fail(error);
      return data;
    },
    async createAsset({ id, filename, sizeBytes, sourceKey }) {
      fail((await db.from('media_assets').insert({ id, original_filename: filename, content_type: 'video/mp4', size_bytes: sizeBytes, source_key: sourceKey, status: 'queued' })).error);
    },
    async setReplay(eventId, assetId) {
      fail((await db.from('live_events').update({ replay_asset_id: assetId }).eq('id', eventId)).error);
    },
    enqueueTranscode,
  };
}
