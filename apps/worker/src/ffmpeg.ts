import type { Rendition } from '@chouf/shared';
import { spawn } from 'node:child_process';

export interface ProbeResult {
  width: number;
  height: number;
  durationSeconds: number;
  hasAudio: boolean;
}

interface FfprobeStream {
  codec_type?: string;
  width?: number;
  height?: number;
  tags?: { rotate?: string };
  side_data_list?: { rotation?: number }[];
}

function run(cmd: string, args: string[], onStdout?: (chunk: string) => void): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8').on('data', (c: string) => {
      if (onStdout) onStdout(c);
      else stdout += c;
    });
    child.stderr.setEncoding('utf8').on('data', (c: string) => {
      stderr = (stderr + c).slice(-8000); // keep the tail for error reports
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${cmd} exited with ${code}: ${stderr.trim().split('\n').slice(-5).join(' | ')}`));
    });
  });
}

export async function probe(input: string): Promise<ProbeResult> {
  const { stdout } = await run('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', input]);
  return parseProbe(JSON.parse(stdout) as { streams?: FfprobeStream[]; format?: { duration?: string } });
}

export function parseProbe(data: { streams?: FfprobeStream[]; format?: { duration?: string } }): ProbeResult {
  const streams = data.streams ?? [];
  const video = streams.find((s) => s.codec_type === 'video' && s.width && s.height);
  if (!video?.width || !video.height) throw new Error('no video stream found');
  const rotation = Math.abs(Number(video.side_data_list?.find((d) => d.rotation !== undefined)?.rotation ?? video.tags?.rotate ?? 0));
  const swap = rotation === 90 || rotation === 270;
  const durationSeconds = Number(data.format?.duration ?? 0);
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) throw new Error('could not read duration');
  return {
    width: swap ? video.height : video.width,
    height: swap ? video.width : video.height,
    durationSeconds,
    hasAudio: streams.some((s) => s.codec_type === 'audio'),
  };
}

export interface HlsArgsInput {
  input: string;
  outDir: string;
  renditions: Rendition[];
  hasAudio: boolean;
  preset: string;
  segmentSeconds?: number;
}

/**
 * One decode, N encodes: split the video, scale each branch, encode H.264 with keyframes forced
 * every 2 s so all renditions align, and mux to HLS with a master playlist.
 */
export function buildHlsArgs({ input, outDir, renditions, hasAudio, preset, segmentSeconds = 6 }: HlsArgsInput): string[] {
  const n = renditions.length;
  const split = `[0:v:0]split=${n}${renditions.map((_, i) => `[v${i}]`).join('')}`;
  const scales = renditions.map((r, i) => `[v${i}]scale=${r.width}:${r.height}:flags=bicubic,setsar=1[v${i}o]`);
  const args = ['-hide_banner', '-nostats', '-y', '-i', input, '-filter_complex', [split, ...scales].join(';')];

  renditions.forEach((r, i) => {
    args.push(
      '-map', `[v${i}o]`,
      `-c:v:${i}`, 'libx264',
      `-profile:v:${i}`, r.height >= 720 ? 'high' : 'main',
      `-b:v:${i}`, `${r.videoBitrateKbps}k`,
      `-maxrate:v:${i}`, `${Math.round(r.videoBitrateKbps * 1.07)}k`,
      `-bufsize:v:${i}`, `${Math.round(r.videoBitrateKbps * 1.5)}k`,
    );
  });
  if (hasAudio) {
    renditions.forEach((r, i) => {
      args.push('-map', '0:a:0', `-c:a:${i}`, 'aac', `-b:a:${i}`, `${r.audioBitrateKbps}k`, `-ac:a:${i}`, '2');
    });
  }

  const streamMap = renditions.map((r, i) => (hasAudio ? `v:${i},a:${i},name:${r.name}` : `v:${i},name:${r.name}`)).join(' ');

  args.push(
    '-preset', preset,
    '-pix_fmt', 'yuv420p',
    '-force_key_frames', 'expr:gte(t,n_forced*2)',
    '-sc_threshold', '0',
    '-f', 'hls',
    '-hls_time', String(segmentSeconds),
    '-hls_playlist_type', 'vod',
    '-hls_flags', 'independent_segments',
    '-hls_segment_type', 'mpegts',
    '-hls_segment_filename', `${outDir}/%v/seg_%05d.ts`,
    '-master_pl_name', 'master.m3u8',
    '-var_stream_map', streamMap,
    '-progress', 'pipe:1',
    `${outDir}/%v/index.m3u8`,
  );
  return args;
}

/** Runs ffmpeg and reports progress (0–100) parsed from `-progress pipe:1`. */
export async function runFfmpeg(args: string[], durationSeconds: number, onProgress: (pct: number) => void): Promise<void> {
  let buffer = '';
  await run('ffmpeg', args, (chunk) => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const m = /^out_time_(?:us|ms)=(\d+)/.exec(line);
      if (m && durationSeconds > 0) {
        onProgress(Math.min(99, Math.floor((Number(m[1]) / 1e6 / durationSeconds) * 100)));
      }
    }
  });
}

export async function extractPoster(input: string, output: string, atSeconds: number): Promise<void> {
  await run('ffmpeg', [
    '-hide_banner', '-y', '-ss', atSeconds.toFixed(2), '-i', input,
    '-frames:v', '1', '-vf', 'scale=1280:-2', '-q:v', '3', output,
  ]);
}
