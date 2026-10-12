/** BullMQ queue contract shared by the web app (producer) and the worker (consumer). */
export const QUEUES = {
  transcode: 'transcode',
  maintenance: 'maintenance',
} as const;

export interface TranscodeJobData {
  assetId: string;
}

export type MaintenanceJobName = 'expire-subscriptions' | 'enforce-licenses' | 'prune-sessions';

export const TRANSCODE_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 60_000 },
  removeOnComplete: { age: 7 * 24 * 3600, count: 1000 },
  removeOnFail: { age: 30 * 24 * 3600 },
} as const;
