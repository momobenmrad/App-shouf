import { type LiveToVodJobData, type MaintenanceJobName, type MonitorJobName, QUEUES, TRANSCODE_JOB_OPTIONS, type TranscodeJobData } from '@chouf/shared';
import { Queue, Worker } from 'bullmq';
import pino from 'pino';
import { createAlerter } from './alerts';
import { loadConfig } from './config';
import { createServiceClient, createTranscodeRepo } from './db';
import { importEpg } from './epg';
import { createEpgRepo } from './epg-repo';
import { createLiveToVodRepo } from './live-to-vod-repo';
import { processLiveToVod } from './live-to-vod';
import { runMonitorCycle } from './monitor';
import { createMonitorRepo, pruneHealthChecks } from './monitor-repo';
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

const transcodeQueue = new Queue(QUEUES.transcode, { connection });
const liveToVodRepo = createLiveToVodRepo(db, (assetId) =>
  transcodeQueue.add('transcode', { assetId }, { ...TRANSCODE_JOB_OPTIONS, jobId: `${assetId}-0` }).then(() => undefined),
);

const transcodeWorker = new Worker<TranscodeJobData | LiveToVodJobData>(
  QUEUES.transcode,
  async (job) => {
    if (job.name === 'live-to-vod') {
      return processLiveToVod(job.data as LiveToVodJobData, { repo: liveToVodRepo, storage, recordingsDir: config.RECORDINGS_DIR, workDir: config.WORK_DIR, log });
    }
    return processTranscode(
      { id: job.id ?? 'unknown', data: job.data as TranscodeJobData, attemptsMade: job.attemptsMade, maxAttempts: job.opts.attempts ?? 1 },
      { repo, storage, workDir: config.WORK_DIR, preset: config.TRANSCODE_PRESET, log },
    );
  },
  // Long jobs: renew the lock often enough and allow up to 6 h per encode.
  { connection, concurrency: config.TRANSCODE_CONCURRENCY, lockDuration: 120_000, stalledInterval: 60_000 },
);

transcodeWorker.on('failed', (job, err) => {
  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    const target = 'assetId' in job.data ? `l'asset ${job.data.assetId}` : `le replay de l'événement ${job.data.eventId}`;
    void alert.send(`Transcodage échoué pour ${target} : ${err.message.slice(0, 300)}`);
  }
});

const maintenanceQueue = new Queue<unknown, unknown, MaintenanceJobName>(QUEUES.maintenance, { connection });
await maintenanceQueue.upsertJobScheduler('expire-subscriptions', { pattern: '*/15 * * * *' }, { name: 'expire-subscriptions' });
await maintenanceQueue.upsertJobScheduler('prune-sessions', { every: 5 * 60_000 }, { name: 'prune-sessions' });
await maintenanceQueue.upsertJobScheduler('enforce-licenses', { pattern: '5 0 * * *', tz: 'Africa/Tunis' }, { name: 'enforce-licenses' });
await maintenanceQueue.upsertJobScheduler('prune-health-checks', { pattern: '35 1 * * *', tz: 'Africa/Tunis' }, { name: 'prune-health-checks' });
await maintenanceQueue.upsertJobScheduler('import-epg', { pattern: '10 3 * * *', tz: 'Africa/Tunis' }, { name: 'import-epg' });

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
      case 'prune-health-checks':
        return pruneHealthChecks(db);
      case 'import-epg':
        return importEpg(createEpgRepo(db), log);
    }
  },
  { connection, concurrency: 1 },
);

// Source monitor: one probe cycle every 30 s, never overlapping (concurrency 1, 25 s stall guard).
const monitorQueue = new Queue<unknown, unknown, MonitorJobName>(QUEUES.monitor, { connection });
await monitorQueue.upsertJobScheduler('probe-sources', { every: 30_000 }, { name: 'probe-sources', opts: { removeOnComplete: { count: 50 }, removeOnFail: { count: 50 } } });
const monitorRepo = createMonitorRepo(db);
const monitorWorker = new Worker<unknown, unknown, MonitorJobName>(
  QUEUES.monitor,
  async () => {
    const result = await runMonitorCycle({ repo: monitorRepo, alert, log });
    if (result.changes > 0) log.warn(result, 'source changes applied');
    return result;
  },
  { connection, concurrency: 1, lockDuration: 60_000 },
);

log.info({ concurrency: config.TRANSCODE_CONCURRENCY, preset: config.TRANSCODE_PRESET }, 'worker started');

async function shutdown(signal: string) {
  log.info({ signal }, 'shutting down');
  await Promise.allSettled([transcodeWorker.close(), maintenanceWorker.close(), monitorWorker.close(), maintenanceQueue.close(), monitorQueue.close(), transcodeQueue.close()]);
  process.exit(0);
}
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
