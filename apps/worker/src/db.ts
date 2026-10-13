import type { Database, MediaAssetRow, Rendition } from '@chouf/shared';
import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import type { WorkerConfig } from './config';

export type ServiceClient = SupabaseClient<Database>;

export function createServiceClient(config: WorkerConfig): ServiceClient {
  return createClient<Database>(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** The narrow set of writes the transcoder needs; mocked in tests. */
export interface TranscodeRepo {
  getAsset(id: string): Promise<MediaAssetRow | null>;
  startJob(assetId: string, queueJobId: string, attempt: number): Promise<string>;
  finishJob(jobId: string, status: 'completed' | 'failed', log?: string): Promise<void>;
  updateAsset(id: string, patch: Partial<Pick<MediaAssetRow, 'status' | 'progress' | 'error' | 'duration_seconds' | 'width' | 'height' | 'hls_prefix' | 'protection'>> & { renditions?: Rendition[] }): Promise<void>;
}

function check<T extends { error: { message: string } | null }>(res: T): T {
  if (res.error) throw new Error(res.error.message);
  return res;
}

export function createTranscodeRepo(db: ServiceClient): TranscodeRepo {
  return {
    async getAsset(id) {
      const { data } = check(await db.from('media_assets').select('*').eq('id', id).maybeSingle());
      return data;
    },
    async startJob(assetId, queueJobId, attempt) {
      const { data } = check(
        await db
          .from('transcode_jobs')
          .insert({ asset_id: assetId, queue_job_id: queueJobId, attempt, status: 'active', started_at: new Date().toISOString() })
          .select('id')
          .single(),
      );
      if (!data) throw new Error('transcode job insert returned no row');
      return data.id;
    },
    async finishJob(jobId, status, log) {
      check(await db.from('transcode_jobs').update({ status, log: log ?? null, finished_at: new Date().toISOString() }).eq('id', jobId));
    },
    async updateAsset(id, patch) {
      check(await db.from('media_assets').update(patch).eq('id', id));
    },
  };
}
