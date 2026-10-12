import { TitleForm } from '@/components/admin/TitleForm';
import { readyAssets } from '@/server/admin-data';
import { env } from '@/server/env';
import { createUserClient } from '@/server/supabase';

export default async function NewTitle() {
  const db = await createUserClient();
  const [{ data: genres }, assets] = await Promise.all([db.from('genres').select('*').order('slug'), readyAssets(db)]);
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Nouveau titre</h1>
      <TitleForm genres={genres ?? []} selectedGenres={[]} assets={assets} assetsBaseUrl={env().VOD_BASE_URL} />
    </div>
  );
}
