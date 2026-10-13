import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().int().default(8788),
  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  PLAYBACK_SIGNING_SECRET: z.string().min(32),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  /** Where MediaMTX serves HLS, reachable from the gateway only. */
  MEDIAMTX_HLS_URL: z.url().default('http://mediamtx:8888'),
  /** Shared secret embedded in the hook URLs MediaMTX calls. */
  MEDIAMTX_HOOK_SECRET: z.string().min(16),
  LIVE_ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  /** Encoder disconnect tolerated before an event is considered ended. */
  LIVE_END_GRACE_SECONDS: z.coerce.number().int().min(0).default(120),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type GatewayConfig = z.infer<typeof schema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): GatewayConfig {
  return schema.parse(env);
}
