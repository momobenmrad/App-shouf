import type { Database } from '@chouf/shared';
import { createClient } from '@supabase/supabase-js';
import type { Logger } from 'pino';
import { type Resolver, TtlCache } from './resolver';

export interface SupabaseResolverOptions {
  url: string;
  serviceKey: string;
  mediamtxHlsUrl: string;
  log: Logger;
  /** Called when an event ends so the replay job can be queued. */
  onEventEnded?: (event: { id: string; stream_path: string; record: boolean }) => Promise<void>;
}

export function createSupabaseResolver(opts: SupabaseResolverOptions): Resolver {
  const db = createClient<Database>(opts.url, opts.serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const channels = new TtlCache<string | null>(5_000);
  const events = new TtlCache<string | null>(5_000);
  const base = opts.mediamtxHlsUrl.replace(/\/+$/, '');

  return {
    channelUpstream: (channelId) =>
      channels.get(channelId, async () => {
        const { data, error } = await db
          .from('channels')
          .select('status, active_source_id, channel_sources!channels_active_source_fk(url, enabled)')
          .eq('id', channelId)
          .maybeSingle();
        if (error) throw new Error(error.message);
        const source = data?.channel_sources as unknown as { url: string; enabled: boolean } | null;
        return data?.status === 'active' && source?.enabled ? source.url : null;
      }),

    eventUpstream: (eventId) =>
      events.get(eventId, async () => {
        const { data, error } = await db.from('live_events').select('status, published, stream_path').eq('id', eventId).maybeSingle();
        if (error) throw new Error(error.message);
        return data?.published && data.status === 'live' ? `${base}/${data.stream_path}/index.m3u8` : null;
      }),

    async authorizePublish(path, key) {
      const { data, error } = await db.rpc('authorize_live_publish', { p_path: path, p_key: key });
      if (error) {
        opts.log.error({ err: error.message }, 'authorize_live_publish failed');
        return false;
      }
      return !!data;
    },

    async streamReady(path) {
      const { data } = await db
        .from('live_events')
        .update({ status: 'live', started_at: new Date().toISOString() })
        .eq('stream_path', path)
        .neq('status', 'ended')
        .is('started_at', null)
        .select('id');
      // Reconnection after a short drop: keep the original started_at.
      if (!data?.length) await db.from('live_events').update({ status: 'live' }).eq('stream_path', path).neq('status', 'ended');
      const { data: ev } = await db.from('live_events').select('id').eq('stream_path', path).maybeSingle();
      if (ev) events.invalidate(ev.id);
      opts.log.info({ path }, 'stream ready');
    },

    async streamEnded(path) {
      const { data } = await db
        .from('live_events')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('stream_path', path)
        .eq('status', 'live')
        .select('id, stream_path, record')
        .maybeSingle();
      if (!data) return;
      events.invalidate(data.id);
      opts.log.info({ path, eventId: data.id }, 'stream ended');
      await opts.onEventEnded?.(data);
    },
  };
}
