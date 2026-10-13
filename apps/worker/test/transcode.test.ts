import type { MediaAssetRow } from '@chouf/shared';
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pino from 'pino';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { TranscodeRepo } from '../src/db';
import { aes128Provider } from '../src/protection';
import type { Storage } from '../src/storage';
import { processTranscode } from '../src/transcode';
import { makeClip } from './helpers';

const dir = mkdtempSync(join(tmpdir(), 'chouf-transcode-'));
const fixture = join(dir, 'fixture.mp4');
beforeAll(() => makeClip(fixture, { width: 854, height: 480, seconds: 3, audio: true }));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const ASSET_ID = '3f2b8c1e-1d2a-4c6b-9e7f-0a1b2c3d4e5f';

function fakes(downloadError?: Error) {
  const asset = { id: ASSET_ID, source_key: `sources/${ASSET_ID}/movie.mp4`, status: 'queued' } as MediaAssetRow;
  const updates: Record<string, unknown>[] = [];
  const jobs: { status: string; log?: string }[] = [];
  const uploaded: string[] = [];
  const contents = new Map<string, Buffer>();
  const repo: TranscodeRepo = {
    getAsset: async () => asset,
    startJob: async () => 'job-row-1',
    finishJob: async (_id, status, log) => void jobs.push({ status, log }),
    updateAsset: async (_id, patch) => void updates.push(patch),
  };
  const storage: Storage = {
    download: async (_key, file) => {
      if (downloadError) throw downloadError;
      copyFileSync(fixture, file);
    },
    uploadFile: async (key, file) => {
      uploaded.push(key);
      if (key.endsWith('.m3u8') || key.endsWith('.bin') || key.endsWith('seg_00000.ts')) contents.set(key, readFileSync(file));
    },
  };
  return { repo, storage, updates, jobs, uploaded, contents };
}

const log = pino({ level: 'silent' });
const deps = (f: ReturnType<typeof fakes>) => ({ repo: f.repo, storage: f.storage, workDir: dir, preset: 'ultrafast', log });

describe('processTranscode', () => {
  it('uploads the HLS ladder and marks the asset ready', async () => {
    const f = fakes();
    await processTranscode({ id: 'q1', data: { assetId: ASSET_ID }, attemptsMade: 0, maxAttempts: 3 }, deps(f));
    const last = f.updates.at(-1)!;
    expect(last).toMatchObject({ status: 'ready', progress: 100, hls_prefix: `hls/${ASSET_ID}`, width: 854, height: 480, duration_seconds: 3 });
    expect((last.renditions as { name: string }[]).map((r) => r.name)).toEqual(['240p', '360p', '480p']);
    expect(f.uploaded).toContain(`hls/${ASSET_ID}/master.m3u8`);
    expect(f.uploaded).toContain(`hls/${ASSET_ID}/480p/index.m3u8`);
    expect(f.uploaded).toContain(`hls/${ASSET_ID}/poster.jpg`);
    expect(f.jobs).toEqual([{ status: 'completed', log: undefined }]);
    expect(last.protection).toBe('none');
    expect(f.uploaded).not.toContain(`hls/${ASSET_ID}/key.bin`);
  }, 60_000);

  it('encrypts renditions with a per-asset AES-128 key served next to the playlists', async () => {
    const f = fakes();
    await processTranscode({ id: 'q3', data: { assetId: ASSET_ID }, attemptsMade: 0, maxAttempts: 3 }, { ...deps(f), keyProvider: aes128Provider });
    expect(f.updates.at(-1)).toMatchObject({ status: 'ready', protection: 'aes128' });
    expect(f.contents.get(`hls/${ASSET_ID}/key.bin`)).toHaveLength(16);
    const variant = f.contents.get(`hls/${ASSET_ID}/360p/index.m3u8`)!.toString();
    expect(variant).toContain('#EXT-X-KEY:METHOD=AES-128,URI="../key.bin"');
    // Encrypted segments no longer start with the MPEG-TS sync byte.
    expect(f.contents.get(`hls/${ASSET_ID}/360p/seg_00000.ts`)![0]).not.toBe(0x47);
    expect(f.uploaded).not.toContain(`hls/${ASSET_ID}/key.info`);
  }, 60_000);

  it('requeues on a retryable failure and fails the asset on the last attempt', async () => {
    const f1 = fakes(new Error('network down'));
    await expect(processTranscode({ id: 'q2', data: { assetId: ASSET_ID }, attemptsMade: 0, maxAttempts: 3 }, deps(f1))).rejects.toThrow('network down');
    expect(f1.updates.at(-1)).toEqual({ status: 'queued', error: 'network down' });

    const f2 = fakes(new Error('network down'));
    await expect(processTranscode({ id: 'q2', data: { assetId: ASSET_ID }, attemptsMade: 2, maxAttempts: 3 }, deps(f2))).rejects.toThrow();
    expect(f2.updates.at(-1)).toEqual({ status: 'failed', error: 'network down' });
    expect(f2.jobs).toEqual([{ status: 'failed', log: 'network down' }]);
  });
});
