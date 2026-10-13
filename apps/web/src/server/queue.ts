import 'server-only';
import { type LiveToVodJobData, QUEUES, TRANSCODE_JOB_OPTIONS, type TranscodeJobData } from '@chouf/shared';
import { Queue } from 'bullmq';
import { env } from './env';

const globalForQueue = globalThis as unknown as { transcodeQueue?: Queue<TranscodeJobData | LiveToVodJobData> };

function transcodeQueue(): Queue<TranscodeJobData | LiveToVodJobData> {
  globalForQueue.transcodeQueue ??= new Queue<TranscodeJobData | LiveToVodJobData>(QUEUES.transcode, {
    connection: { url: env().REDIS_URL, maxRetriesPerRequest: null },
  });
  return globalForQueue.transcodeQueue;
}

/** Enqueues a transcode; the job id makes re-submission of the same asset idempotent while queued. */
export async function enqueueTranscode(assetId: string, attempt = 0): Promise<string> {
  const job = await transcodeQueue().add('transcode', { assetId }, { ...TRANSCODE_JOB_OPTIONS, jobId: `${assetId}-${attempt}` });
  return job.id ?? assetId;
}

/** Queues the replay build of an ended live event. */
export async function enqueueLiveToVod(eventId: string, streamPath: string): Promise<void> {
  await transcodeQueue().add('live-to-vod', { eventId, streamPath }, { ...TRANSCODE_JOB_OPTIONS, jobId: `live-to-vod-${eventId}-${Date.now()}` });
}
