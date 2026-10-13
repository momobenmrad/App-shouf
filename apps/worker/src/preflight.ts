// Pre-flight check: verifies that the production configuration actually works before the first
// start (and after any change). Run on the server:
//   docker compose run --rm worker node dist/preflight.js
// Every check prints ✔ or ✘ with what to fix. Exits 1 when something blocking fails.
import { HeadBucketCommand, DeleteObjectCommand, GetBucketCorsCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { signPlaybackUrl } from '@chouf/shared';
import { createClient } from '@supabase/supabase-js';
import { Redis } from 'ioredis';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const env = process.env;

type Result = { name: string; ok: boolean; detail: string; blocking: boolean };
const results: Result[] = [];
const record = (name: string, ok: boolean, detail: string, blocking = true) => results.push({ name, ok, detail, blocking });

async function check(name: string, blocking: boolean, fn: () => Promise<string>) {
  try {
    record(name, true, await fn(), blocking);
  } catch (err) {
    record(name, false, err instanceof Error ? err.message : String(err), blocking);
  }
}

const need = (key: string): string => {
  const v = env[key];
  if (!v) throw new Error(`variable ${key} manquante dans .env`);
  return v;
};

const PLACEHOLDERS = ['dev-only', 'change-me', 'placeholder', 'chouf-dev-secret'];

await check('Variables obligatoires', true, async () => {
  const required = ['APP_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'PLAYBACK_SIGNING_SECRET', 'VOD_BASE_URL', 'LIVE_BASE_URL', 'S3_ENDPOINT', 'S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'MEDIAMTX_HOOK_SECRET'];
  const missing = required.filter((k) => !env[k]);
  if (missing.length) throw new Error(`manquantes : ${missing.join(', ')}`);
  const weak = required.filter((k) => PLACEHOLDERS.some((p) => env[k]!.includes(p)));
  if (weak.length) throw new Error(`valeurs de développement encore présentes : ${weak.join(', ')} (openssl rand -base64 48)`);
  if (env.PLAYBACK_SIGNING_SECRET!.length < 32) throw new Error('PLAYBACK_SIGNING_SECRET doit faire au moins 32 caractères');
  if (env.APP_URL!.startsWith('http://') && !env.APP_URL!.includes('localhost')) throw new Error('APP_URL doit être en https en production');
  return `${required.length} variables présentes`;
});

await check('Supabase : clé service et migrations', true, async () => {
  const db = createClient(need('SUPABASE_URL'), need('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
  const { error: planErr, count } = await db.from('plans').select('id', { count: 'exact', head: true });
  if (planErr) throw new Error(`accès refusé ou projet injoignable : ${planErr.message}`);
  // Tables of the last migrations: proves `supabase db push` ran fully.
  for (const table of ['live_event_keys', 'viewer_profiles', 'epg_programs'] as const) {
    const { error } = await db.from(table).select('*', { count: 'exact', head: true });
    if (error) throw new Error(`table ${table} absente : lancez \`supabase db push\` (${error.message})`);
  }
  return `${count ?? 0} offre(s) tarifaire(s), migrations à jour`;
});

await check('Supabase : clé anon publique', true, async () => {
  const db = createClient(need('NEXT_PUBLIC_SUPABASE_URL'), need('NEXT_PUBLIC_SUPABASE_ANON_KEY'), { auth: { persistSession: false } });
  const { error } = await db.from('plans').select('id').limit(1);
  if (error) throw new Error(error.message);
  return 'lecture publique OK';
});

await check('Au moins un administrateur', false, async () => {
  const db = createClient(need('SUPABASE_URL'), need('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
  const { count } = await db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin');
  if (!count) throw new Error("aucun admin : créez un compte puis `update profiles set role = 'admin' where id = …`");
  return `${count} admin(s)`;
});

await check('Redis', true, async () => {
  const redis = new Redis(env.REDIS_URL ?? 'redis://localhost:6379', { lazyConnect: true, maxRetriesPerRequest: 1, connectTimeout: 5000 });
  redis.on('error', () => undefined); // reported through the check result, not the console
  try {
    await redis.connect();
    return await redis.ping();
  } finally {
    redis.disconnect();
  }
});

await check('Stockage S3/R2 : bucket, écriture, CORS', true, async () => {
  const s3 = new S3Client({
    region: env.S3_REGION ?? 'auto',
    endpoint: need('S3_ENDPOINT'),
    forcePathStyle: true,
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
    credentials: { accessKeyId: need('S3_ACCESS_KEY_ID'), secretAccessKey: need('S3_SECRET_ACCESS_KEY') },
  });
  const Bucket = need('S3_BUCKET');
  await s3.send(new HeadBucketCommand({ Bucket }));
  const Key = `preflight/${Date.now()}.txt`;
  await s3.send(new PutObjectCommand({ Bucket, Key, Body: 'ok', ContentType: 'text/plain' }));
  await s3.send(new DeleteObjectCommand({ Bucket, Key }));
  let cors = 'CORS non lisible (vérifiez à la main que ETag est exposé)';
  try {
    const rules = (await s3.send(new GetBucketCorsCommand({ Bucket }))).CORSRules ?? [];
    const ok = rules.some((r) => r.AllowedMethods?.includes('PUT') && r.ExposeHeaders?.some((h) => h.toLowerCase() === 'etag'));
    if (!ok) throw new Error('règle CORS manquante : PUT autorisé depuis APP_URL avec ExposeHeaders ETag, sinon les uploads du back-office échouent');
    cors = 'CORS OK';
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('règle CORS')) throw err;
  }
  return `écriture/suppression OK, ${cors}`;
});

await check('Edge VOD : santé et secret de signature', true, async () => {
  const base = need('VOD_BASE_URL').replace(/\/+$/, '');
  const health = await fetch(`${base}/health`, { signal: AbortSignal.timeout(8000) });
  if (!health.ok) throw new Error(`${base}/health → HTTP ${health.status} (edge non déployé ?)`);
  const url = await signPlaybackUrl({ baseUrl: base, secret: need('PLAYBACK_SIGNING_SECRET'), scope: 'vod', resourceId: '00000000-0000-0000-0000-000000000000', exp: Math.floor(Date.now() / 1000) + 60, entry: 'master.m3u8' });
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (res.status === 403) throw new Error('jeton refusé : SIGNING_SECRET de l’edge différent de PLAYBACK_SIGNING_SECRET (wrangler secret put SIGNING_SECRET)');
  if (res.status !== 404) throw new Error(`réponse inattendue HTTP ${res.status}`);
  return 'jeton accepté (404 attendu sur un asset inexistant)';
});

await check('Gateway live', true, async () => {
  const base = need('LIVE_BASE_URL').replace(/\/+$/, '');
  const res = await fetch(`${base}/health`, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`${base}/health → HTTP ${res.status}`);
  return 'OK';
});

await check('MediaMTX (HLS interne)', false, async () => {
  const base = (env.MEDIAMTX_HLS_URL ?? 'http://mediamtx:8888').replace(/\/+$/, '');
  const res = await fetch(`${base}/`, { signal: AbortSignal.timeout(5000) });
  return `répond (HTTP ${res.status})`;
});

await check('Site web', false, async () => {
  const res = await fetch(`${need('APP_URL').replace(/\/+$/, '')}/ar`, { redirect: 'manual', signal: AbortSignal.timeout(10000) });
  if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
  return `HTTP ${res.status}`;
});

await check('Konnect', false, async () => {
  if (!env.KONNECT_API_KEY || !env.KONNECT_WALLET_ID) throw new Error('KONNECT_API_KEY / KONNECT_WALLET_ID absents : le paiement sera indisponible (503)');
  const base = (env.KONNECT_API_URL ?? 'https://api.sandbox.konnect.network/api/v2').replace(/\/+$/, '');
  const res = await fetch(`${base}/payments/preflight-does-not-exist`, { headers: { 'x-api-key': env.KONNECT_API_KEY }, signal: AbortSignal.timeout(10000) });
  if (res.status === 401 || res.status === 403) throw new Error(`clé API refusée (HTTP ${res.status})`);
  return `clé acceptée (HTTP ${res.status} sur une référence inconnue)${base.includes('sandbox') ? ' — SANDBOX' : ' — PRODUCTION'}`;
});

await check('FFmpeg', true, async () => {
  const { stdout } = await run('ffmpeg', ['-version']);
  return stdout.split('\n')[0] ?? 'présent';
});

await check('Alertes', false, async () => {
  if (!env.ALERT_WEBHOOK_URL) throw new Error('ALERT_WEBHOOK_URL absent : les alertes ne seront visibles que dans les logs');
  return 'webhook configuré';
});

// Report ---------------------------------------------------------------------------------------
let failedBlocking = 0;
for (const r of results) {
  const mark = r.ok ? '✔' : r.blocking ? '✘' : '⚠';
  console.log(`${mark} ${r.name.padEnd(44)} ${r.detail}`);
  if (!r.ok && r.blocking) failedBlocking++;
}
console.log('');
if (failedBlocking) {
  console.log(`${failedBlocking} contrôle(s) bloquant(s) en échec. Corrigez puis relancez.`);
  process.exit(1);
}
console.log('Configuration prête. Lancez `docker compose up -d` puis suivez la recette (docs/phase-1-tasks.md).');
