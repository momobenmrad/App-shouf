import { execFileSync } from 'node:child_process';

/** Generates a short synthetic clip (test pattern + optional tone) with ffmpeg. */
export function makeClip(file: string, opts: { width: number; height: number; seconds: number; audio: boolean }) {
  const args = ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', `testsrc2=size=${opts.width}x${opts.height}:rate=25:duration=${opts.seconds}`];
  if (opts.audio) args.push('-f', 'lavfi', '-i', `sine=frequency=440:duration=${opts.seconds}`);
  args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p');
  if (opts.audio) args.push('-c:a', 'aac', '-shortest');
  args.push(file);
  execFileSync('ffmpeg', args);
}
