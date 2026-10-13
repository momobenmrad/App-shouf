import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import { getAdmin } from '@/server/auth';

// Back-office in French for the MVP (single operator); viewer pages are fully localised.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (!(await getAdmin())) notFound();
  return (
    <div dir="ltr" lang="fr" className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
      <aside className="w-48 shrink-0">
        <nav className="sticky top-20 flex flex-col gap-1 text-sm">
          <Link href="/admin" locale="fr" className="rounded px-3 py-2 hover:bg-panel">Tableau de bord</Link>
          <Link href="/admin/titles" locale="fr" className="rounded px-3 py-2 hover:bg-panel">Catalogue</Link>
          <Link href="/admin/media" locale="fr" className="rounded px-3 py-2 hover:bg-panel">Médias & transcodage</Link>
          <span className="mt-3 px-3 text-xs uppercase tracking-wide text-muted">Direct</span>
          <Link href="/admin/channels" locale="fr" className="rounded px-3 py-2 hover:bg-panel">Chaînes & sources</Link>
          <Link href="/admin/incidents" locale="fr" className="rounded px-3 py-2 hover:bg-panel">Incidents</Link>
          <Link href="/admin/live" locale="fr" className="rounded px-3 py-2 hover:bg-panel">Événements live</Link>
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
