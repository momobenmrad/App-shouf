import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pino from 'pino';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type LiveToVodRepo, listRecordings, processLiveToVod } from '../src/live-to-vod';
import type { Storage } from '../src/storage';

const root = mkdtempSync(join(tmpdir(), 'chouf-l2v-'));
const recordings = join(root, 'recordings');
const EVENT = '50000000-0000-0000-0000-000000000001';

beforeAll(() => {
  const dir = join(recordings, 'live', 'finale');
  mkdirSync(dir, { recursive: true });
  for (const [i, name] of ['2026-10-12_20-00-00-000000.mp4', '2026-10-12_20-00-02-000000.mp4'].entries()) {
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', `testsrc2=size=320x180:rate=25:duration=2`, '-f', 'lavfi', '-i', `sine=frequency=${440 + i * 100}:duration=2`, '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', '-movflags', '+frag_keyframe+empty_moov', join(dir, name)]);
  }
});
afterAll(() => rmSync(root, { recursive: true, force: true }));

function fakes(event: { record: boolean; replay_asset_id: string | null } = { record: true, replay_asset_id: null }) {
  const uploaded: { key: string; size: number }[] = [];
  const created: { id: string; filename: string }[] = [];
  const queued: string[] = [];
  let replay: string | null = null;
  const repo: LiveToVodRepo = {
    getEvent: async () => ({ id: EVENT, slug: 'finale', ...event }),
    createAsset: async (a) => void created.push({ id: a.id, filename: a.filename }),
    setReplay: async (_e, id) => void (replay = id),
    enqueueTranscode: async (id) => void queued.push(id),
  };
  const storage: Storage = {
    download: async () => {},
    uploadFile: async (key, file) => void uploaded.push({ key, size: (await import('node:fs/promises')).stat(file).then((s) => s.size) as unknown as number }),
  };
  return { repo, storage, uploaded, created, queued, replay: () => replay };
}

const deps = (f: ReturnType<typeof fakes>) => ({ repo: f.repo, storage: f.storage, recordingsDir: recordings, workDir: root, log: pino({ level: 'silent' }) });

describe('live-to-vod', () => {
  it('lists recordings oldest first', async () => {
    const files = await listRecordings(recordings, 'live/finale');
    expect(files.map((f) => f.split('/').pop())).toEqual(['2026-10-12_20-00-00-000000.mp4', '2026-10-12_20-00-02-000000.mp4']);
    expect(await listRecordings(recordings, 'live/nothing')).toEqual([]);
  });

  it('concatenates the recording, creates the asset and queues its transcode', async () => {
    const f = fakes();
    expect(await processLiveToVod({ eventId: EVENT, streamPath: 'live/finale' }, deps(f))).toBe('done');
    expect(f.created).toHaveLength(1);
    expect(f.created[0]!.filename).toBe('finale-replay.mp4');
    expect(f.uploaded[0]!.key).toBe(`sources/${f.created[0]!.id}/finale-replay.mp4`);
    expect(f.queued).toEqual([f.created[0]!.id]);
    expect(f.replay()).toBe(f.created[0]!.id);
  });

  it('skips events that are not recorded, already have a replay, or have no files', async () => {
    expect(await processLiveToVod({ eventId: EVENT, streamPath: 'live/finale' }, deps(fakes({ record: false, replay_asset_id: null })))).toBe('skipped');
    expect(await processLiveToVod({ eventId: EVENT, streamPath: 'live/finale' }, deps(fakes({ record: true, replay_asset_id: 'x' })))).toBe('skipped');
    const f = fakes();
    expect(await processLiveToVod({ eventId: EVENT, streamPath: 'live/empty' }, deps(f))).toBe('skipped');
    expect(f.created).toEqual([]);
  });
});
