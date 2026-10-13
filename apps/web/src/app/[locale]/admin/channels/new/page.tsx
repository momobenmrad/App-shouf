import { ChannelForm } from '@/components/admin/ChannelForm';
import { env } from '@/server/env';

export default function NewChannel() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Nouvelle chaîne</h1>
      <p className="mb-6 text-sm text-muted">Créez la chaîne, puis ajoutez ses sources sous licence. Seules les chaînes avec une source saine sont diffusées.</p>
      <ChannelForm assetsBaseUrl={env().VOD_BASE_URL} />
    </div>
  );
}
