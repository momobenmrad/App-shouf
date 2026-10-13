// Content protection for VOD renditions.
// AES-128: one random key per asset, stored next to the HLS files (key.bin) so it is only
// reachable through the signed, time-limited playback path. Variant playlists reference it as
// "../key.bin". ffmpeg derives the IV from the segment sequence number.
// A DRM key provider (CENC multi-key via a licence service) would implement the same interface.
import { randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export type Protection = 'none' | 'aes128';

export interface KeyMaterial {
  /** Path ffmpeg reads with -hls_key_info_file (kept outside the upload directory). */
  keyInfoFile: string;
}

export interface KeyProvider {
  readonly protection: Protection;
  /** Writes key material; `hlsDir` is uploaded, `scratchDir` is not. */
  prepare(assetId: string, hlsDir: string, scratchDir: string): Promise<KeyMaterial | null>;
}

export const noProtection: KeyProvider = {
  protection: 'none',
  prepare: async () => null,
};

export const aes128Provider: KeyProvider = {
  protection: 'aes128',
  async prepare(_assetId, hlsDir, scratchDir) {
    const key = randomBytes(16);
    const keyFile = join(hlsDir, 'key.bin');
    await writeFile(keyFile, key);
    const keyInfoFile = join(scratchDir, 'key.info');
    // Line 1: URI the player fetches (relative to the variant playlist). Line 2: key path for ffmpeg.
    await writeFile(keyInfoFile, `../key.bin\n${keyFile}\n`);
    return { keyInfoFile };
  },
};

export function keyProviderFor(protection: Protection): KeyProvider {
  return protection === 'aes128' ? aes128Provider : noProtection;
}
