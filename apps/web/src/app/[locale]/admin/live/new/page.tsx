import { EventForm } from '@/components/admin/EventForm';
import { env } from '@/server/env';

export default function NewLiveEvent() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Nouvel événement live</h1>
      <p className="mb-6 text-sm text-muted">La clé de stream est générée à la création et affichée une seule fois.</p>
      <EventForm assetsBaseUrl={env().VOD_BASE_URL} />
    </div>
  );
}
