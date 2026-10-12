/** Minimal read-only object store, implemented by R2 (prod) and S3/MinIO (dev). */
export interface StoredObject {
  body: ReadableStream<Uint8Array>;
  size?: number;
  etag?: string;
}

export interface ObjectStore {
  get(key: string): Promise<StoredObject | null>;
}

const MIME: Record<string, string> = {
  m3u8: 'application/vnd.apple.mpegurl',
  ts: 'video/mp2t',
  m4s: 'video/iso.segment',
  mp4: 'video/mp4',
  aac: 'audio/aac',
  vtt: 'text/vtt; charset=utf-8',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export function contentTypeFor(key: string): string {
  const ext = key.slice(key.lastIndexOf('.') + 1).toLowerCase();
  return MIME[ext] ?? 'application/octet-stream';
}
