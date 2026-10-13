import { M3uImport } from '@/components/admin/M3uImport';
import { Link } from '@/i18n/navigation';

export default function ImportChannels() {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Importer une playlist M3U</h1>
        <Link href="/admin/channels" locale="fr" className="text-sm text-muted hover:text-white">← Chaînes</Link>
      </div>
      <p className="mb-6 text-sm text-muted">
        Crée en une fois les fiches des chaînes d’une playlist (attributs <code>tvg-id</code>, <code>tvg-name</code>, <code>tvg-country</code>, <code>tvg-language</code>, <code>group-title</code>). Les chaînes déjà présentes (même slug) ne sont pas modifiées.
      </p>
      <M3uImport />
    </div>
  );
}
