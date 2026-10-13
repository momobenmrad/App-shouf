'use client';

import { useState } from 'react';

/** Uploads an image to storage through a presigned PUT and stores its path in a hidden input. */
export function ArtworkInput({ name, label, initialPath, assetsBaseUrl }: { name: string; label: string; initialPath: string | null; assetsBaseUrl: string }) {
  const [path, setPath] = useState(initialPath ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/artwork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: file.type, size: file.size }),
      });
      const data = (await res.json()) as { path?: string; uploadUrl?: string; error?: string };
      if (!res.ok || !data.uploadUrl || !data.path) throw new Error(data.error ?? 'presign failed');
      const put = await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type, 'Cache-Control': 'public, max-age=31536000, immutable' },
        body: file,
      });
      if (!put.ok) throw new Error(`upload failed (${put.status})`);
      setPath(data.path);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      <input type="hidden" name={name} value={path} />
      <div className="flex items-center gap-3">
        {path ? <img src={`${assetsBaseUrl}/a/${path}`} alt="" className="h-20 rounded border border-line object-cover" /> : <div className="h-20 w-14 rounded border border-dashed border-line" />}
        <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} className="text-xs" />
        {path && <button type="button" onClick={() => setPath('')} className="text-xs text-red-400">Retirer</button>}
      </div>
      {busy && <p className="mt-1 text-xs text-muted">Envoi…</p>}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
