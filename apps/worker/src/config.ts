import { z } from 'zod';

const schema = z.object({
  REDIS_URL: z.string().default('redis://localhost:6379'),
  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  S3_ENDPOINT: z.url(),
  S3_REGION: z.string().default('auto'),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  TRANSCODE_CONCURRENCY: z.coerce.number().int().min(1).max(8).default(1),
  TRANSCODE_PRESET: z.enum(['ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium', 'slow']).default('veryfast'),
  WORK_DIR: z.string().default('/tmp/chouf-work'),
  ALERT_WEBHOOK_URL: z.url().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type WorkerConfig = z.infer<typeof schema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): WorkerConfig {
  return schema.parse(env);
}
