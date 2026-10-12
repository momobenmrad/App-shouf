import { type MaintenanceJobName, QUEUES, type TranscodeJobData } from '@chouf/shared';
import { Queue, Worker } from 'bullmq';
import pino from 'pino';
import { createAlerter } from './alerts';
import { loadConfig } from './config';
import { createServiceClient, createTranscodeRepo } from './db';
import { enforceLicenses, expireSubscriptions, pruneSessions } from './maintenance';
import { createS3Storage } from './storage';
import { processTranscode } from './transcode';

const config = loadConfig();
const log = pino({ level: config.LOG_LEVEL, base: { service: 'chouf-worker' } });
const connection = { url: config.REDIS_URL, maxRetriesPerRequest: null };
const db = createServiceClient(config);
const storage = createS3Storage(config);
const alert = createAlerter(config.ALERT_WEBHOOK_URL, log);
const repo = createTranscodeRepo(db);

const transcodeWorker = new Worker<TranscodeJobData>(
  QUEUES.transcode,
  (job) =>
    processTranscode(
      { id: job.id ?? 'unknown', data: job.data, attemptsMade: job.attemptsMade, maxAttempts: job.opts.attempts ?? 1 },
      { repo, storage, workDir: config.WORK_DIR, preset: config.TRANSCODE_PRESET, log },
    ),
  // Long jobs: renew the lock often enough and allow up to 6 h per encode.
  { connection, concurrency: config.TRANSCODE_CONCURRENCY, lockDuration: 120_000, stalledInterval: 60_000 },
);

transcodeWorker.on('failed', (job, err) => {
  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    void alert.send(`Transcodage échoué pour l'asset ${job.data.assetId} : ${err.message.slice(0, 300)}`);
  }
});

const maintenanceQueue = new Queue<unknown, unknown, MaintenanceJobName>(QUEUES.maintenance, { connection });
await maintenanceQueue.upsertJobScheduler('expire-subscriptions', { pattern: '*/15 * * * *' }, { name: 'expire-subscriptions' });
await maintenanceQueue.upsertJobScheduler('prune-sessions', { every: 5 * 60_000 }, { name: 'prune-sessions' });
await maintenanceQueue.upsertJobScheduler('enforce-licenses', { pattern: '5 0 * * *', tz: 'Africa/Tunis' }, { name: 'enforce-licenses' });

const maintenanceWorker = new Worker<unknown, unknown, MaintenanceJobName>(
  QUEUES.maintenance,
  async (job) => {
    switch (job.name) {
      case 'expire-subscriptions':
        return expireSubscriptions(db, log);
      case 'prune-sessions':
        return pruneSessions(db);
      case 'enforce-licenses':
        return enforceLicenses(db, alert, log);
    }
  },
  { connection, concurrency: 1 },
);

log.info({ concurrency: config.TRANSCODE_CONCURRENCY, preset: config.TRANSCODE_PRESET }, 'worker started');

async function shutdown(signal: string) {
  log.info({ signal }, 'shutting down');
  await Promise.allSettled([transcodeWorker.close(), maintenanceWorker.close(), maintenanceQueue.close()]);
  process.exit(0);
}
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
