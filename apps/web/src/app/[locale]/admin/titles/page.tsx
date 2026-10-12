import { pickText } from '@chouf/shared';
import { Link } from '@/i18n/navigation';
import { createUserClient } from '@/server/supabase';

const STATUS: Record<string, string> = { draft: 'Brouillon', published: 'Publié', archived: 'Archivé' };

export default async function AdminTitles() {
  const db = await createUserClient();
  const { data: titles } = await db.from('titles').select('id, slug, kind, name, status, access, asset_id, updated_at').order('updated_at', { ascending: false });
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Catalogue</h1>
        <Link href="/admin/titles/new" locale="fr" className="rounded-md bg-brand px-4 py-2 text-sm font-semibold hover:bg-brand-dark">+ Nouveau titre</Link>
      </div>
      <table className="w-full overflow-hidden rounded-lg border border-line text-sm">
        <thead className="bg-panel text-left text-muted">
          <tr>
            <th className="p-3">Titre</th><th className="p-3">Type</th><th className="p-3">Accès</th><th className="p-3">Statut</th><th className="p-3">Vidéo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {(titles ?? []).map((t) => (
            <tr key={t.id} className="hover:bg-panel/60">
              <td className="p-3"><Link href={`/admin/titles/${t.id}`} locale="fr" className="font-semibold hover:underline">{pickText(t.name, 'fr')}</Link><div className="text-xs text-muted">{t.slug}</div></td>
              <td className="p-3">{t.kind === 'movie' ? 'Film' : 'Série'}</td>
              <td className="p-3">{t.access === 'free' ? 'Gratuit' : 'Abonnés'}</td>
              <td className="p-3">{STATUS[t.status]}</td>
              <td className="p-3">{t.kind === 'series' ? '—' : t.asset_id ? '✓' : <span className="text-amber-400">manquante</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
