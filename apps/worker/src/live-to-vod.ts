// Turns the fMP4 recording MediaMTX wrote for an event into a VOD source asset.
import { type LiveToVodJobData, hlsPrefix, sourceKey } from '@chouf/shared';
import { execFile } from 'node:child_process';
import { mkdtemp, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { Logger } from 'pino';
import type { Storage } from './storage';

const run = promisify(execFile);

export interface LiveToVodRepo {
  getEvent(id: string): Promise<{ id: string; slug: string; record: boolean; replay_asset_id: string | null } | null>;
  createAsset(input: { id: string; filename: string; sizeBytes: number; sourceKey: string }): Promise<void>;
  setReplay(eventId: string, assetId: string): Promise<void>;
  enqueueTranscode(assetId: string): Promise<void>;
}

export interface LiveToVodDeps {
  repo: LiveToVodRepo;
  storage: Storage;
  recordingsDir: string;
  workDir: string;
  log: Logger;
}

/** Recording files of a stream path, oldest first. MediaMTX names them by start time. */
export async function listRecordings(recordingsDir: string, streamPath: string): Promise<string[]> {
  const dir = join(recordingsDir, streamPath);
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.mp4'))
    .map((e) => join(dir, e.name))
    .sort();
}

/** Lossless concatenation of same-encoding fMP4 recordings into one MP4. */
export async function concatRecordings(files: string[], output: string, workDir: string): Promise<void> {
  const list = join(workDir, 'concat.txt');
  await writeFile(list, files.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'));
  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', output]);
}

export async function processLiveToVod(data: LiveToVodJobData, deps: LiveToVodDeps): Promise<'done' | 'skipped'> {
  const event = await deps.repo.getEvent(data.eventId);
  if (!event || !event.record) return 'skipped';
  if (event.replay_asset_id) return 'skipped'; // already produced (job retried after success)

  const files = await listRecordings(deps.recordingsDir, data.streamPath);
  if (files.length === 0) {
    deps.log.warn({ eventId: event.id, streamPath: data.streamPath }, 'no recording found for ended event');
    return 'skipped';
  }

  const dir = await mkdtemp(join(deps.workDir, `replay-${event.id}-`));
  try {
    const output = join(dir, 'replay.mp4');
    await concatRecordings(files, output, dir);
    const size = (await stat(output)).size;
    const assetId = crypto.randomUUID();
    const filename = `${event.slug}-replay.mp4`;
    const key = sourceKey(assetId, filename);
    await deps.storage.uploadFile(key, output, 'video/mp4', 'private, max-age=0');
    await deps.repo.createAsset({ id: assetId, filename, sizeBytes: size, sourceKey: key });
    await deps.repo.setReplay(event.id, assetId);
    await deps.repo.enqueueTranscode(assetId);
    deps.log.info({ eventId: event.id, assetId, files: files.length, size, hls: hlsPrefix(assetId) }, 'replay queued for transcoding');
    // Recordings are kept on disk until the operator removes them (see docs/operations.md).
    return 'done';
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
