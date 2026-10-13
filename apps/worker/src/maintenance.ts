import { decideActiveSource, isLicenseActive } from '@chouf/shared';
import type { Logger } from 'pino';
import type { ServiceClient } from './db';
import type { Alerter } from './alerts';

export async function expireSubscriptions(db: ServiceClient, log: Logger): Promise<number> {
  const { data, error } = await db.rpc('expire_subscriptions');
  if (error) throw new Error(error.message);
  if (data) log.info({ count: data }, 'expired subscriptions');
  return data ?? 0;
}

export async function pruneSessions(db: ServiceClient): Promise<void> {
  const cutoff = new Date(Date.now() - 5 * 60_000).toISOString();
  const { error } = await db
    .from('playback_sessions')
    .update({ ended_at: new Date().toISOString() })
    .is('ended_at', null)
    .lt('last_heartbeat_at', cutoff);
  if (error) throw new Error(error.message);
}

/**
 * Disables sources whose licence expired and deactivates channels left without a valid source.
 * Runs daily; the Phase 2 monitor applies the same rule on every check.
 */
export async function enforceLicenses(db: ServiceClient, alert: Alerter, log: Logger, today = new Date().toISOString().slice(0, 10)) {
  const { data: sources, error } = await db.from('channel_sources').select('*').eq('enabled', true);
  if (error) throw new Error(error.message);

  const expired = (sources ?? []).filter((s) => !isLicenseActive(s.license_info, today));
  for (const s of expired) {
    await db.from('channel_sources').update({ enabled: false }).eq('id', s.id);
    await db.from('source_incidents').insert({
      channel_id: s.channel_id,
      source_id: s.id,
      kind: 'license_expired',
      details: { expires_at: s.license_info.expires_at, agreement_ref: s.license_info.agreement_ref },
    });
    await alert.send(`Licence expirée : source « ${s.label} » (${s.license_info.agreement_ref}) désactivée.`);
  }

  const touched = new Set(expired.map((s) => s.channel_id));
  for (const channelId of touched) {
    const [{ data: channel }, { data: all }] = await Promise.all([
      db.from('channels').select('*').eq('id', channelId).single(),
      db.from('channel_sources').select('*').eq('channel_id', channelId),
    ]);
    if (!channel) continue;
    const decision = decideActiveSource(all ?? [], channel.active_source_id, today);
    if (decision.activeSourceId === null) {
      await db.from('channels').update({ status: 'inactive', active_source_id: null, auto_disabled_reason: 'license_expired' }).eq('id', channelId);
      await alert.send(`Chaîne « ${channel.slug} » désactivée : plus aucune source sous licence valide.`);
    } else if (decision.activeSourceId !== channel.active_source_id) {
      await db.from('channels').update({ active_source_id: decision.activeSourceId }).eq('id', channelId);
    }
  }
  if (expired.length) log.warn({ count: expired.length }, 'disabled sources with expired licences');
  return expired.length;
}
