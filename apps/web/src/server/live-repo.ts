import 'server-only';
import type { LicenseInfo } from '@chouf/shared';
import type { LiveRepo } from './live';
import { createPlaybackRepo } from './playback-repo';
import type { ServiceClient } from './supabase';

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export function createLiveRepo(db: ServiceClient): LiveRepo {
  const playback = createPlaybackRepo(db);
  return {
    async getChannel(id) {
      const { data, error } = await db
        .from('channels')
        .select('id, status, access, active_source_id, channel_sources!channels_active_source_fk(license_info, enabled)')
        .eq('id', id)
        .maybeSingle();
      fail(error);
      if (!data) return null;
      const source = data.channel_sources as unknown as { license_info: LicenseInfo; enabled: boolean } | null;
      return { id: data.id, status: data.status, access: data.access, active_source_id: data.active_source_id, license: source?.enabled ? source.license_info : null };
    },
    async getEvent(id) {
      const { data, error } = await db.from('live_events').select('id, published, status, access, geo_allow').eq('id', id).maybeSingle();
      fail(error);
      return data;
    },
    getActivePlanStreams: playback.getActivePlanStreams,
    async openSession({ userId, channelId, eventId, deviceId, country, maxStreams }) {
      const { data, error } = await db.rpc('open_playback_session', {
        p_user_id: userId,
        p_asset_id: null,
        p_channel_id: channelId,
        p_event_id: eventId,
        p_device_id: deviceId,
        p_country: country,
        p_max_streams: maxStreams,
      });
      if (error?.code === 'CH001') return 'too_many_streams';
      fail(error);
      if (!data) throw new Error('open_playback_session returned nothing');
      return { id: data.id };
    },
  };
}
