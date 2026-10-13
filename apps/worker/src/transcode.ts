import { type TranscodeJobData, hlsPrefix, selectRenditions } from '@chouf/shared';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import type { Logger } from 'pino';
import type { TranscodeRepo } from './db';
import { buildHlsArgs, extractPoster, probe, runFfmpeg } from './ffmpeg';
import { type KeyProvider, noProtection } from './protection';
import { type Storage, uploadDirectory } from './storage';

export interface TranscodeDeps {
  repo: TranscodeRepo;
  storage: Storage;
  workDir: string;
  preset: string;
  keyProvider?: KeyProvider;
  log: Logger;
}

export interface JobInfo {
  id: string;
  data: TranscodeJobData;
  attemptsMade: number;
  maxAttempts: number;
}

/** Downloads the source, encodes the HLS ladder, uploads it and marks the asset ready. */
export async function processTranscode(job: JobInfo, deps: TranscodeDeps): Promise<void> {
  const { repo, storage, log } = deps;
  const asset = await repo.getAsset(job.data.assetId);
  if (!asset) throw new Error(`asset ${job.data.assetId} not found`);

  const attempt = job.attemptsMade + 1;
  const jobRowId = await repo.startJob(asset.id, job.id, attempt);
  await mkdir(deps.workDir, { recursive: true });
  const dir = await mkdtemp(join(deps.workDir, `${asset.id}-`));

  try {
    await repo.updateAsset(asset.id, { status: 'processing', progress: 0, error: null });
    const input = join(dir, 'source');
    log.info({ assetId: asset.id, key: asset.source_key }, 'downloading source');
    await storage.download(asset.source_key, input);

    const info = await probe(input);
    const renditions = selectRenditions(info.width, info.height);
    log.info({ assetId: asset.id, info, renditions: renditions.map((r) => r.name) }, 'transcoding');

    const outDir = join(dir, 'hls');
    for (const r of renditions) await mkdir(join(outDir, r.name), { recursive: true });
    const keyProvider = deps.keyProvider ?? noProtection;
    const keys = await keyProvider.prepare(asset.id, outDir, dir);

    let lastReported = -1;
    let lastWrite = 0;
    await runFfmpeg(
      buildHlsArgs({ input, outDir, renditions, hasAudio: info.hasAudio, preset: deps.preset, keyInfoFile: keys?.keyInfoFile }),
      info.durationSeconds,
      (pct) => {
        const now = Date.now();
        if (pct > lastReported && now - lastWrite >= 5000) {
          lastReported = pct;
          lastWrite = now;
          void repo.updateAsset(asset.id, { progress: pct }).catch((err) => log.warn({ err }, 'progress update failed'));
        }
      },
    );

    await extractPoster(input, join(outDir, 'poster.jpg'), Math.min(info.durationSeconds * 0.1, 60));

    const prefix = hlsPrefix(asset.id);
    const count = await uploadDirectory(storage, outDir, prefix);
    log.info({ assetId: asset.id, files: count }, 'uploaded HLS');

    await repo.updateAsset(asset.id, {
      status: 'ready',
      progress: 100,
      hls_prefix: prefix,
      duration_seconds: Math.round(info.durationSeconds),
      width: info.width,
      height: info.height,
      renditions,
      protection: keyProvider.protection,
    });
    await repo.finishJob(jobRowId, 'completed');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const final = attempt >= job.maxAttempts;
    log.error({ assetId: asset.id, attempt, final, err: message }, 'transcode failed');
    await repo.finishJob(jobRowId, 'failed', message.slice(0, 4000));
    await repo.updateAsset(asset.id, final ? { status: 'failed', error: message.slice(0, 1000) } : { status: 'queued', error: message.slice(0, 1000) });
    throw err;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
