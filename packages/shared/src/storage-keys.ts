/** Object key conventions shared by the web app, the worker and the edge. */

export function sanitizeFilename(filename: string): string {
  const base = filename.split(/[\\/]/).pop() ?? '';
  const dot = base.lastIndexOf('.');
  const clean = (v: string) =>
    v
      .normalize('NFKD')
      .replace(/[^\w-]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
  const stem = clean(dot > 0 ? base.slice(0, dot) : base).slice(0, 100) || 'source';
  const ext = dot > 0 ? clean(base.slice(dot + 1)).toLowerCase().slice(0, 10) : '';
  return ext ? `${stem}.${ext}` : stem;
}

export const sourceKey = (assetId: string, filename: string) => `sources/${assetId}/${sanitizeFilename(filename)}`;
export const hlsPrefix = (assetId: string) => `hls/${assetId}`;
export const artworkKey = (id: string, ext: string) => `artwork/${id}.${ext.replace(/[^a-z0-9]/gi, '').toLowerCase()}`;
