import 'server-only';
import { QUEUES, TRANSCODE_JOB_OPTIONS, type TranscodeJobData } from '@chouf/shared';
import { Queue } from 'bullmq';
import { env } from './env';

const globalForQueue = globalThis as unknown as { transcodeQueue?: Queue<TranscodeJobData> };

function transcodeQueue(): Queue<TranscodeJobData> {
  globalForQueue.transcodeQueue ??= new Queue<TranscodeJobData>(QUEUES.transcode, {
    connection: { url: env().REDIS_URL, maxRetriesPerRequest: null },
  });
  return globalForQueue.transcodeQueue;
}

/** Enqueues a transcode; the job id makes re-submission of the same asset idempotent while queued. */
export async function enqueueTranscode(assetId: string, attempt = 0): Promise<string> {
  const job = await transcodeQueue().add('transcode', { assetId }, { ...TRANSCODE_JOB_OPTIONS, jobId: `${assetId}-${attempt}` });
  return job.id ?? assetId;
}
