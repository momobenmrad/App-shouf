'use client';

import type { MediaAssetRow } from '@chouf/shared';
import { useEffect, useRef, useState } from 'react';
import { getBrowserSupabase } from '@/lib/supabase-browser';
import { uploadVideo } from '@/lib/uploader';

type Asset = Pick<MediaAssetRow, 'id' | 'original_filename' | 'status' | 'progress' | 'error' | 'size_bytes' | 'height' | 'duration_seconds' | 'created_at'>;

const STATUS: Record<string, string> = { uploading: 'Envoi', uploaded: 'Envoyé', queued: 'En file', processing: 'Transcodage', ready: 'Prêt', failed: 'Échec' };
const COLOR: Record<string, string> = { ready: 'text-emerald-400', failed: 'text-red-400', processing: 'text-sky-400', queued: 'text-amber-400' };

interface Upload {
  name: string;
  loaded: number;
  total: number;
  error?: string;
  controller: AbortController;
}

export function MediaManager({ initial, supabaseUrl, supabaseAnonKey }: { initial: Asset[]; supabaseUrl: string; supabaseAnonKey: string }) {
  const [assets, setAssets] = useState<Asset[]>(initial);
  const [uploads, setUploads] = useState<Record<string, Upload>>({});
  const input = useRef<HTMLInputElement>(null);

  // Live transcoding progress: Supabase Realtime on media_assets (RLS: admins only).
  useEffect(() => {
    const supabase = getBrowserSupabase(supabaseUrl, supabaseAnonKey);
    const channel = supabase
      .channel('admin-media-assets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'media_assets' }, (payload) => {
        const row = payload.new as Asset;
        if (!row?.id) return;
        setAssets((list) => [row, ...list.filter((a) => a.id !== row.id)].sort((a, b) => b.created_at.localeCompare(a.created_at)));
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabaseUrl, supabaseAnonKey]);

  async function start(files: FileList) {
    for (const file of Array.from(files)) {
      const key = `${file.name}-${file.size}-${file.lastModified}`;
      const controller = new AbortController();
      setUploads((u) => ({ ...u, [key]: { name: file.name, loaded: 0, total: file.size, controller } }));
      uploadVideo(file, {
        signal: controller.signal,
        onProgress: (loaded, total) => setUploads((u) => (u[key] ? { ...u, [key]: { ...u[key], loaded, total } } : u)),
      })
        .then(() =>
          setUploads((u) => {
            const rest = { ...u };
            delete rest[key];
            return rest;
          }),
        )
        .catch((err: unknown) => setUploads((u) => (u[key] ? { ...u, [key]: { ...u[key], error: err instanceof Error ? err.message : String(err) } } : u)));
    }
  }

  async function retry(id: string) {
    await fetch(`/api/admin/assets/${id}/retry`, { method: 'POST' });
  }

  return (
    <div className="space-y-6">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files.length) void start(e.dataTransfer.files);
        }}
        className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-line bg-panel p-8 text-center"
      >
        <p className="text-muted">Glissez des vidéos ici (MP4, MOV, MKV — jusqu’à 100 Go). L’envoi reprend automatiquement en cas de coupure.</p>
        <input ref={input} type="file" accept="video/*" multiple hidden onChange={(e) => e.target.files && start(e.target.files)} />
        <button onClick={() => input.current?.click()} className="rounded-md bg-brand px-4 py-2 text-sm font-semibold hover:bg-brand-dark">Choisir des fichiers</button>
      </div>

      {Object.entries(uploads).map(([key, u]) => (
        <div key={key} className="rounded-md border border-line bg-panel p-3 text-sm">
          <div className="flex justify-between">
            <span>{u.name}</span>
            <span>{Math.floor((u.loaded / u.total) * 100)} %</span>
          </div>
          <div className="mt-2 h-1.5 rounded bg-line"><div className="h-full rounded bg-brand" style={{ width: `${(u.loaded / u.total) * 100}%` }} /></div>
          {u.error ? (
            <p className="mt-2 text-red-400">{u.error} — resélectionnez le même fichier pour reprendre.</p>
          ) : (
            <button onClick={() => u.controller.abort()} className="mt-2 text-xs text-muted hover:text-white">Interrompre</button>
          )}
        </div>
      ))}

      <table className="w-full rounded-lg border border-line text-sm">
        <thead className="bg-panel text-left text-muted">
          <tr><th className="p-3">Fichier</th><th className="p-3">Statut</th><th className="p-3">Infos</th><th className="p-3" /></tr>
        </thead>
        <tbody className="divide-y divide-line">
          {assets.map((a) => (
            <tr key={a.id}>
              <td className="p-3"><div className="font-medium">{a.original_filename}</div><div className="text-xs text-muted">{a.id}</div></td>
              <td className={`p-3 ${COLOR[a.status] ?? ''}`}>
                {STATUS[a.status]} {a.status === 'processing' && `${a.progress} %`}
                {a.status === 'processing' && <div className="mt-1 h-1 w-32 rounded bg-line"><div className="h-full rounded bg-sky-400" style={{ width: `${a.progress}%` }} /></div>}
                {a.error && <div className="mt-1 max-w-sm text-xs text-red-400">{a.error}</div>}
              </td>
              <td className="p-3 text-muted">
                {(a.size_bytes / 1024 ** 3).toFixed(2)} Go{a.height ? ` · ${a.height}p` : ''}{a.duration_seconds ? ` · ${Math.round(a.duration_seconds / 60)} min` : ''}
              </td>
              <td className="p-3 text-end">{a.status === 'failed' && <button onClick={() => retry(a.id)} className="rounded bg-white/10 px-3 py-1 text-xs hover:bg-white/20">Relancer</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
