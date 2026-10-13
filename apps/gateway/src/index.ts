import { QUEUES, TRANSCODE_JOB_OPTIONS } from '@chouf/shared';
import { serve } from '@hono/node-server';
import { Queue } from 'bullmq';
import pino from 'pino';
import { createGatewayApp } from './app';
import { loadConfig } from './config';
import { createSupabaseResolver } from './supabase-resolver';

const config = loadConfig();
const log = pino({ level: config.LOG_LEVEL, base: { service: 'chouf-gateway' } });
const transcodeQueue = new Queue(QUEUES.transcode, { connection: { url: config.REDIS_URL, maxRetriesPerRequest: null } });

const resolver = createSupabaseResolver({
  url: config.SUPABASE_URL,
  serviceKey: config.SUPABASE_SERVICE_ROLE_KEY,
  mediamtxHlsUrl: config.MEDIAMTX_HLS_URL,
  log,
  async onEventEnded(event) {
    if (!event.record) return;
    await transcodeQueue.add('live-to-vod', { eventId: event.id, streamPath: event.stream_path }, { ...TRANSCODE_JOB_OPTIONS, jobId: `live-to-vod-${event.id}-${Date.now()}` });
    log.info({ eventId: event.id }, 'queued live-to-vod');
  },
});

const app = createGatewayApp({
  resolver,
  signingSecret: config.PLAYBACK_SIGNING_SECRET,
  hookSecret: config.MEDIAMTX_HOOK_SECRET,
  allowedOrigins: config.LIVE_ALLOWED_ORIGINS.split(',').map((s) => s.trim()),
  internalHosts: [new URL(config.MEDIAMTX_HLS_URL).hostname],
  endGraceMs: config.LIVE_END_GRACE_SECONDS * 1000,
});

serve({ fetch: app.fetch, port: config.PORT }, () => log.info({ port: config.PORT }, 'gateway listening'));
