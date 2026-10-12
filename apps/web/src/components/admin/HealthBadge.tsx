import type { SourceHealth } from '@chouf/shared';

const STYLE: Record<SourceHealth, string> = {
  healthy: 'bg-emerald-600/30 text-emerald-300',
  degraded: 'bg-amber-600/30 text-amber-300',
  down: 'bg-red-600/30 text-red-300',
  unknown: 'bg-white/10 text-muted',
};
const LABEL: Record<SourceHealth, string> = { healthy: 'Saine', degraded: 'Dégradée', down: 'Hors service', unknown: 'Inconnue' };

export function HealthBadge({ health }: { health: SourceHealth }) {
  return <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${STYLE[health]}`}>{LABEL[health]}</span>;
}

export const INCIDENT_LABEL: Record<string, string> = {
  down: 'Source hors service',
  degraded: 'Source dégradée',
  failover: 'Bascule sur le secours',
  failback: 'Retour à la principale',
  license_expired: 'Licence expirée',
  all_sources_down: 'Chaîne hors service',
};
