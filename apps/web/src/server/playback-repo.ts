import 'server-only';
import type { PlaybackRepo } from './playback';
import type { ServiceClient } from './supabase';

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export function createPlaybackRepo(db: ServiceClient): PlaybackRepo {
  return {
    async getTitle(id) {
      const { data, error } = await db.from('titles').select('id, kind, status, access, geo_allow, asset_id').eq('id', id).maybeSingle();
      fail(error);
      return data;
    },
    async getEpisode(id) {
      const { data, error } = await db
        .from('episodes')
        .select('id, status, access, asset_id, seasons!inner(title_id)')
        .eq('id', id)
        .maybeSingle();
      fail(error);
      if (!data) return null;
      const season = data.seasons as unknown as { title_id: string };
      return { id: data.id, status: data.status, access: data.access, asset_id: data.asset_id, title_id: season.title_id };
    },
    async getAsset(id) {
      const { data, error } = await db.from('media_assets').select('id, status, duration_seconds').eq('id', id).maybeSingle();
      fail(error);
      return data;
    },
    async getActivePlanStreams(userId) {
      const { data, error } = await db
        .from('subscriptions')
        .select('status, current_period_end, plans!inner(max_streams)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('current_period_end', new Date().toISOString())
        .maybeSingle();
      fail(error);
      if (!data) return null;
      return (data.plans as unknown as { max_streams: number }).max_streams;
    },
    async openSession({ userId, assetId, deviceId, country, maxStreams }) {
      const { data, error } = await db.rpc('open_playback_session', {
        p_user_id: userId,
        p_asset_id: assetId,
        p_channel_id: null,
        p_event_id: null,
        p_device_id: deviceId,
        p_country: country,
        p_max_streams: maxStreams,
      });
      if (error?.code === 'CH001') return 'too_many_streams';
      fail(error);
      if (!data) throw new Error('open_playback_session returned nothing');
      return { id: data.id };
    },
    async getProgress(userId, assetId) {
      const { data, error } = await db
        .from('playback_progress')
        .select('position_seconds, completed')
        .eq('user_id', userId)
        .eq('asset_id', assetId)
        .maybeSingle();
      fail(error);
      return data;
    },
  };
}
