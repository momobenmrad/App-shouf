import { MediaManager } from '@/components/admin/MediaManager';
import { env } from '@/server/env';
import { createUserClient } from '@/server/supabase';

export default async function AdminMedia() {
  const db = await createUserClient();
  const { data } = await db
    .from('media_assets')
    .select('id, original_filename, status, progress, error, size_bytes, height, duration_seconds, created_at')
    .order('created_at', { ascending: false })
    .limit(200);
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Médias & transcodage</h1>
      <MediaManager initial={data ?? []} supabaseUrl={env().NEXT_PUBLIC_SUPABASE_URL} supabaseAnonKey={env().NEXT_PUBLIC_SUPABASE_ANON_KEY} />
    </div>
  );
}
