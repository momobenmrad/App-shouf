import 'server-only';
import { z } from 'zod';

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  APP_URL: z.url(),
  PLAYBACK_SIGNING_SECRET: z.string().min(32),
  VOD_BASE_URL: z.url(),
  /** Public base URL of the live gateway (https://live.chouf.tn, http://localhost:8788 in dev). */
  LIVE_BASE_URL: z.url().default('http://localhost:8788'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  S3_ENDPOINT: z.url(),
  /** Endpoint the browser uses for direct uploads (differs from S3_ENDPOINT in Docker dev). */
  S3_PUBLIC_ENDPOINT: z.url().optional(),
  S3_REGION: z.string().default('auto'),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  KONNECT_API_URL: z.url().default('https://api.sandbox.konnect.network/api/v2'),
  KONNECT_API_KEY: z.string().optional(),
  KONNECT_WALLET_ID: z.string().optional(),
  /** Ingest endpoints shown to admins for live events. */
  LIVE_INGEST_RTMP_URL: z.string().default('rtmp://localhost:1935'),
  LIVE_INGEST_SRT_URL: z.string().default('srt://localhost:8890'),
  /** Country used when no CDN geo header is present (local dev only). */
  DEFAULT_COUNTRY: z.string().regex(/^[A-Z]{2}$/).optional(),
  /** Concurrent streams for signed-in users without a subscription (free content). */
  FREE_MAX_STREAMS: z.coerce.number().int().min(1).max(5).default(1),
});

export type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | undefined;

export function env(): ServerEnv {
  cached ??= schema.parse(process.env);
  return cached;
}
