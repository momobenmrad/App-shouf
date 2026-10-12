// Resumable multipart upload straight to object storage (R2 / MinIO) through presigned URLs.
// The server keeps the S3 UploadId; on resume we ask it which parts already exist.

export interface PartPlan {
  partNumber: number;
  start: number;
  end: number;
}

export function planParts(size: number, partSize: number): PartPlan[] {
  if (size <= 0 || partSize <= 0) throw new Error('invalid sizes');
  const count = Math.ceil(size / partSize);
  if (count > 10_000) throw new Error('too many parts');
  return Array.from({ length: count }, (_, i) => ({ partNumber: i + 1, start: i * partSize, end: Math.min(size, (i + 1) * partSize) }));
}

export function remainingParts(plan: PartPlan[], done: { partNumber: number; size: number }[]): PartPlan[] {
  const ok = new Map(done.map((p) => [p.partNumber, p.size]));
  return plan.filter((p) => ok.get(p.partNumber) !== p.end - p.start);
}

export interface UploadCallbacks {
  onProgress?: (uploadedBytes: number, totalBytes: number) => void;
  signal?: AbortSignal;
}

const RESUME_KEY = 'chouf.uploads';

function fingerprint(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function loadResume(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(RESUME_KEY) ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

function saveResume(map: Record<string, string>) {
  try {
    localStorage.setItem(RESUME_KEY, JSON.stringify(map));
  } catch {
    // storage unavailable: resume only within this page
  }
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
  return body;
}

function putPart(url: string, blob: Blob, onBytes: (n: number) => void, signal?: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.upload.onprogress = (e) => onBytes(e.loaded);
    xhr.onload = () => {
      const etag = xhr.getResponseHeader('ETag');
      if (xhr.status >= 200 && xhr.status < 300 && etag) resolve(etag);
      else reject(new Error(etag ? `part upload failed (${xhr.status})` : 'missing ETag: expose it in the bucket CORS rules'));
    };
    xhr.onerror = () => reject(new Error('network error'));
    xhr.onabort = () => reject(new DOMException('aborted', 'AbortError'));
    signal?.addEventListener('abort', () => xhr.abort(), { once: true });
    xhr.send(blob);
  });
}

async function withRetry<T>(fn: () => Promise<T>, signal?: AbortSignal, attempts = 4): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (err) {
      if (signal?.aborted || i >= attempts) throw err;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** (i - 1)));
    }
  }
}

/** Uploads (or resumes) a file and returns the asset id once transcoding is queued. */
export async function uploadVideo(file: File, cb: UploadCallbacks = {}, concurrency = 4): Promise<string> {
  const resume = loadResume();
  const fp = fingerprint(file);
  let assetId = resume[fp];
  let partSize = 16 * 1024 * 1024;
  let done: { partNumber: number; etag: string; size: number }[] = [];

  if (assetId) {
    try {
      done = (await api<{ parts: typeof done }>(`/api/admin/uploads/${assetId}/parts`)).parts;
    } catch {
      assetId = undefined; // upload expired or already completed: start over
    }
  }
  if (!assetId) {
    const created = await api<{ assetId: string; partSize: number }>('/api/admin/uploads', {
      method: 'POST',
      body: JSON.stringify({ filename: file.name, size: file.size, contentType: file.type || 'video/mp4' }),
    });
    assetId = created.assetId;
    partSize = created.partSize;
    saveResume({ ...loadResume(), [fp]: assetId });
  } else if (done.length > 0) {
    partSize = done.reduce((max, p) => Math.max(max, p.size), 0) || partSize;
  }

  const plan = planParts(file.size, partSize);
  const todo = remainingParts(plan, done);
  const etags = new Map(done.map((p) => [p.partNumber, p.etag]));
  const inFlight = new Map<number, number>();
  const baseBytes = plan.filter((p) => etags.has(p.partNumber) && !todo.includes(p)).reduce((s, p) => s + (p.end - p.start), 0);
  const report = () => cb.onProgress?.(baseBytes + [...inFlight.values()].reduce((a, b) => a + b, 0), file.size);
  report();

  const queue = [...todo];
  const id = assetId;
  async function worker() {
    while (queue.length) {
      const batch = queue.splice(0, 4);
      const { urls } = await withRetry(
        () => api<{ urls: Record<number, string> }>(`/api/admin/uploads/${id}/parts`, { method: 'POST', body: JSON.stringify({ partNumbers: batch.map((p) => p.partNumber) }) }),
        cb.signal,
      );
      for (const part of batch) {
        const etag = await withRetry(
          () =>
            putPart(urls[part.partNumber]!, file.slice(part.start, part.end), (n) => {
              inFlight.set(part.partNumber, n);
              report();
            }, cb.signal),
          cb.signal,
        );
        etags.set(part.partNumber, etag);
        inFlight.set(part.partNumber, part.end - part.start);
        report();
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, Math.max(1, Math.ceil(todo.length / 4))) }, worker));

  await api(`/api/admin/uploads/${id}/complete`, {
    method: 'POST',
    body: JSON.stringify({ parts: plan.map((p) => ({ partNumber: p.partNumber, etag: etags.get(p.partNumber)! })) }),
  });
  const after = loadResume();
  delete after[fp];
  saveResume(after);
  return id;
}
