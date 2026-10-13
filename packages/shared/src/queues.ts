/** BullMQ queue contract shared by the web app, the gateway (producers) and the worker (consumer). */
export const QUEUES = {
  transcode: 'transcode',
  maintenance: 'maintenance',
  monitor: 'monitor',
} as const;

export interface TranscodeJobData {
  assetId: string;
}

/** Turns the MediaMTX recording of an ended event into a VOD asset, then queues its transcode. */
export interface LiveToVodJobData {
  eventId: string;
  streamPath: string;
}

export type TranscodeQueueJob = { name: 'transcode'; data: TranscodeJobData } | { name: 'live-to-vod'; data: LiveToVodJobData };

export type MaintenanceJobName = 'expire-subscriptions' | 'enforce-licenses' | 'prune-sessions' | 'prune-health-checks' | 'import-epg';
export type MonitorJobName = 'probe-sources';

export const TRANSCODE_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 60_000 },
  removeOnComplete: { age: 7 * 24 * 3600, count: 1000 },
  removeOnFail: { age: 30 * 24 * 3600 },
} as const;
