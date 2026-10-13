import { selectRenditions } from '@chouf/shared';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { buildHlsArgs, parseProbe, probe, runFfmpeg } from '../src/ffmpeg';
import { makeClip } from './helpers';

const dir = mkdtempSync(join(tmpdir(), 'chouf-ffmpeg-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('parseProbe', () => {
  it('swaps dimensions for rotated phone videos', () => {
    const r = parseProbe({
      streams: [{ codec_type: 'video', width: 1920, height: 1080, side_data_list: [{ rotation: -90 }] }],
      format: { duration: '12.5' },
    });
    expect(r).toEqual({ width: 1080, height: 1920, durationSeconds: 12.5, hasAudio: false });
  });
  it('rejects files without video', () => {
    expect(() => parseProbe({ streams: [{ codec_type: 'audio' }], format: { duration: '3' } })).toThrow('no video');
  });
});

describe('buildHlsArgs', () => {
  it('maps one audio track per rendition and names variants', () => {
    const args = buildHlsArgs({ input: 'in.mp4', outDir: '/o', renditions: selectRenditions(1280, 720), hasAudio: true, preset: 'veryfast' });
    expect(args.filter((a) => a === '0:a:0')).toHaveLength(4);
    expect(args[args.indexOf('-var_stream_map') + 1]).toBe('v:0,a:0,name:240p v:1,a:1,name:360p v:2,a:2,name:480p v:3,a:3,name:720p');
    expect(args.at(-1)).toBe('/o/%v/index.m3u8');
  });
  it('omits audio mapping for silent sources', () => {
    const args = buildHlsArgs({ input: 'in.mp4', outDir: '/o', renditions: selectRenditions(640, 360), hasAudio: false, preset: 'veryfast' });
    expect(args).not.toContain('0:a:0');
    expect(args[args.indexOf('-var_stream_map') + 1]).toBe('v:0,name:240p v:1,name:360p');
  });
});

describe('ffmpeg integration', () => {
  for (const audio of [true, false]) {
    it(`encodes a ${audio ? 'with' : 'without'}-audio clip into a capped HLS ladder`, async () => {
      const input = join(dir, `clip-${audio}.mp4`);
      makeClip(input, { width: 640, height: 360, seconds: 4, audio });
      const info = await probe(input);
      expect(info).toMatchObject({ width: 640, height: 360, hasAudio: audio });

      const renditions = selectRenditions(info.width, info.height);
      const out = join(dir, `hls-${audio}`);
      for (const r of renditions) mkdirSync(join(out, r.name), { recursive: true });
      const progress: number[] = [];
      await runFfmpeg(buildHlsArgs({ input, outDir: out, renditions, hasAudio: audio, preset: 'ultrafast', segmentSeconds: 2 }), info.durationSeconds, (p) => progress.push(p));

      const master = readFileSync(join(out, 'master.m3u8'), 'utf8');
      expect(master).toContain('240p/index.m3u8');
      expect(master).toContain('360p/index.m3u8');
      expect(master).not.toContain('720p');
      expect(readFileSync(join(out, '360p/index.m3u8'), 'utf8')).toContain('#EXT-X-ENDLIST');
      expect(readdirSync(join(out, '240p')).filter((f) => f.endsWith('.ts')).length).toBeGreaterThanOrEqual(2);
      expect(existsSync(join(out, '360p/seg_00000.ts'))).toBe(true);
      expect(progress.length).toBeGreaterThan(0);
    }, 60_000);
  }
});
