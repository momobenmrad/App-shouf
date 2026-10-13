'use server';

import { channelSourceUpsertSchema, channelUpsertSchema, liveEventUpsertSchema, parseXmltv, selectProgrammes } from '@chouf/shared';
import { createHash, randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAdmin } from '../auth';
import { enqueueLiveToVod } from '../queue';
import { createServiceClient, createUserClient } from '../supabase';
import type { ActionState } from './admin';

async function adminDb() {
  if (!(await getAdmin())) throw new Error('forbidden');
  return createUserClient();
}

const text = (form: FormData, key: string) => {
  const v = form.get(key);
  return typeof v === 'string' ? v : '';
};
const nullable = (v: string) => (v.trim() === '' ? null : v.trim());
const i18n = (form: FormData, prefix: string) => ({ ar: text(form, `${prefix}_ar`), fr: text(form, `${prefix}_fr`), en: text(form, `${prefix}_en`) });
const issues = (e: { issues: { path: PropertyKey[]; message: string }[] }) => e.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(' · ');
const list = (v: string) => v.split(/[\s,]+/).filter(Boolean);

// Channels ------------------------------------------------------------------------------------

export async function saveChannelAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const db = await adminDb();
  const id = nullable(text(form, 'id'));
  const parsed = channelUpsertSchema.safeParse({
    slug: text(form, 'slug'),
    name: i18n(form, 'name'),
    logo_path: nullable(text(form, 'logo_path')),
    category: text(form, 'category'),
    country: text(form, 'country'),
    language: text(form, 'language'),
    status: text(form, 'status'),
    access: text(form, 'access'),
    epg_url: nullable(text(form, 'epg_url')),
    epg_channel_id: nullable(text(form, 'epg_channel_id')),
  });
  if (!parsed.success) return { error: issues(parsed.error) };
  const row = { ...parsed.data, sort_order: Number(text(form, 'sort_order')) || 0, auto_disabled_reason: null };
  const res = id ? await db.from('channels').update(row).eq('id', id).select('id').single() : await db.from('channels').insert(row).select('id').single();
  if (res.error) return { error: res.error.code === '23505' ? 'Ce slug existe déjà.' : res.error.message };
  revalidatePath('/[locale]/live', 'page');
  if (!id) redirect(`/fr/admin/channels/${res.data.id}`);
  revalidatePath(`/fr/admin/channels/${id}`);
  return { ok: true };
}

export async function deleteChannelAction(form: FormData) {
  const db = await adminDb();
  await db.from('channels').delete().eq('id', text(form, 'id'));
  revalidatePath('/[locale]/live', 'page');
  redirect('/fr/admin/channels');
}

export async function saveSourceAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const db = await adminDb();
  const id = nullable(text(form, 'id'));
  const parsed = channelSourceUpsertSchema.safeParse({
    channel_id: text(form, 'channel_id'),
    label: text(form, 'label'),
    kind: text(form, 'kind'),
    url: text(form, 'url'),
    priority: Number(text(form, 'priority')),
    enabled: form.get('enabled') === 'on',
    license_info: {
      holder: text(form, 'license_holder'),
      agreement_ref: text(form, 'license_ref'),
      expires_at: text(form, 'license_expires_at'),
      territories: list(text(form, 'license_territories')),
      notes: nullable(text(form, 'license_notes')) ?? undefined,
    },
  });
  if (!parsed.success) return { error: issues(parsed.error) };
  // A changed URL is a new feed: forget the previous health so the monitor re-evaluates it.
  const reset = { health: 'unknown' as const, consecutive_failures: 0, consecutive_successes: 0, last_media_sequence: null, last_sequence_change_at: null, last_error: null };
  const res = id
    ? await db.from('channel_sources').update({ ...parsed.data, ...(form.get('reset_health') === 'on' ? reset : {}) }).eq('id', id)
    : await db.from('channel_sources').insert(parsed.data);
  if (res.error) return { error: res.error.code === '23505' ? 'Une source a déjà cette priorité sur cette chaîne.' : res.error.message };
  revalidatePath(`/fr/admin/channels/${parsed.data.channel_id}`);
  return { ok: true };
}

export async function toggleSourceAction(form: FormData) {
  const db = await adminDb();
  await db.from('channel_sources').update({ enabled: form.get('enabled') === 'true' }).eq('id', text(form, 'id'));
  revalidatePath(`/fr/admin/channels/${text(form, 'channel_id')}`);
}

export async function deleteSourceAction(form: FormData) {
  const db = await adminDb();
  await db.from('channel_sources').delete().eq('id', text(form, 'id'));
  revalidatePath(`/fr/admin/channels/${text(form, 'channel_id')}`);
}

/** Immediate EPG import for one channel (the worker does it nightly for all). */
export async function importEpgNowAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const db = await adminDb();
  const id = text(form, 'id');
  const { data: channel } = await db.from('channels').select('id, epg_url, epg_channel_id').eq('id', id).single();
  if (!channel?.epg_url || !channel.epg_channel_id) return { error: 'Renseignez l’URL XMLTV et l’identifiant de la chaîne.' };
  let xml: string;
  try {
    const res = await fetch(channel.epg_url, { signal: AbortSignal.timeout(30_000), headers: { Accept: 'application/xml,text/xml' } });
    if (!res.ok) return { error: `Téléchargement impossible (HTTP ${res.status}).` };
    xml = await res.text();
  } catch (err) {
    return { error: `Téléchargement impossible : ${err instanceof Error ? err.message : String(err)}` };
  }
  const doc = parseXmltv(xml);
  const from = new Date(Date.now() - 6 * 3_600_000).toISOString();
  const to = new Date(Date.now() + 8 * 86_400_000).toISOString();
  const rows = selectProgrammes(doc, channel.epg_channel_id, from, to);
  if (rows.length === 0) {
    return { error: `Aucun programme pour « ${channel.epg_channel_id} ». Identifiants présents : ${doc.channels.map((c) => c.id).slice(0, 15).join(', ') || 'aucun'}` };
  }
  await db.from('epg_programs').delete().eq('channel_id', id).gte('start_at', from).lt('start_at', to);
  const { error } = await db.from('epg_programs').upsert(
    rows.map((p) => ({ channel_id: id, start_at: p.start, end_at: p.end, title: p.title, description: p.description, category: p.category, rating: p.rating })),
    { onConflict: 'channel_id,start_at' },
  );
  if (error) return { error: error.message };
  await db.from('channels').update({ epg_updated_at: new Date().toISOString() }).eq('id', id);
  revalidatePath(`/fr/admin/channels/${id}`);
  return { ok: true };
}

export async function resolveIncidentAction(form: FormData) {
  const db = await adminDb();
  await db.from('source_incidents').update({ resolved_at: new Date().toISOString() }).eq('id', text(form, 'id'));
  revalidatePath('/fr/admin/incidents');
}

// Live events ---------------------------------------------------------------------------------

function newStreamKey(): { key: string; hash: string } {
  const key = randomBytes(24).toString('base64url');
  return { key, hash: createHash('sha256').update(key, 'utf8').digest('hex') };
}

export type EventActionState = ActionState & { streamKey?: string };

export async function saveEventAction(_prev: EventActionState, form: FormData): Promise<EventActionState> {
  const db = await adminDb();
  const id = nullable(text(form, 'id'));
  const parsed = liveEventUpsertSchema.safeParse({
    slug: text(form, 'slug'),
    name: i18n(form, 'name'),
    description: i18n(form, 'description'),
    poster_path: nullable(text(form, 'poster_path')),
    access: text(form, 'access'),
    geo_allow: list(text(form, 'geo_allow')),
    published: form.get('published') === 'on',
    scheduled_at: nullable(text(form, 'scheduled_at')) ? new Date(text(form, 'scheduled_at')).toISOString() : null,
    chat_enabled: form.get('chat_enabled') === 'on',
    record: form.get('record') === 'on',
  });
  if (!parsed.success) return { error: issues(parsed.error) };

  if (id) {
    // The ingest path is fixed once the event exists: encoders are configured with it.
    const patch: Partial<typeof parsed.data> = { ...parsed.data };
    delete patch.slug;
    const { error } = await db.from('live_events').update(patch).eq('id', id);
    if (error) return { error: error.message };
    revalidatePath(`/fr/admin/live/${id}`);
    return { ok: true };
  }

  const res = await db.from('live_events').insert({ ...parsed.data, stream_path: `live/${parsed.data.slug}` }).select('id').single();
  if (res.error) return { error: res.error.code === '23505' ? 'Ce slug existe déjà.' : res.error.message };
  const { key, hash } = newStreamKey();
  const { error } = await createServiceClient().from('live_event_keys').insert({ event_id: res.data.id, key_hash: hash });
  if (error) return { error: `Événement créé mais clé non enregistrée : ${error.message}` };
  redirect(`/fr/admin/live/${res.data.id}?key=${encodeURIComponent(key)}`);
}

export async function rotateStreamKeyAction(form: FormData) {
  if (!(await getAdmin())) throw new Error('forbidden');
  const id = text(form, 'id');
  const { key, hash } = newStreamKey();
  await createServiceClient().from('live_event_keys').upsert({ event_id: id, key_hash: hash, rotated_at: new Date().toISOString() });
  redirect(`/fr/admin/live/${id}?key=${encodeURIComponent(key)}`);
}

export async function endEventAction(form: FormData) {
  const db = await adminDb();
  const id = text(form, 'id');
  const { data } = await db.from('live_events').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', id).eq('status', 'live').select('stream_path, record').maybeSingle();
  if (data?.record) await enqueueLiveToVod(id, data.stream_path);
  revalidatePath(`/fr/admin/live/${id}`);
}

export async function reopenEventAction(form: FormData) {
  const db = await adminDb();
  const id = text(form, 'id');
  await db.from('live_events').update({ status: 'scheduled', started_at: null, ended_at: null }).eq('id', id);
  revalidatePath(`/fr/admin/live/${id}`);
}

export async function deleteEventAction(form: FormData) {
  const db = await adminDb();
  await db.from('live_events').delete().eq('id', text(form, 'id'));
  redirect('/fr/admin/live');
}

/** Creates a draft movie title from the replay so it can be published like any VOD. */
export async function createReplayTitleAction(form: FormData) {
  const db = await adminDb();
  const { data: event } = await db.from('live_events').select('slug, name, description, poster_path, access, geo_allow, replay_asset_id').eq('id', text(form, 'id')).single();
  if (!event?.replay_asset_id) return;
  const { data, error } = await db
    .from('titles')
    .insert({ kind: 'movie', slug: `${event.slug}-replay`, name: event.name, synopsis: event.description, poster_path: event.poster_path, access: event.access, geo_allow: event.geo_allow, asset_id: event.replay_asset_id, status: 'draft' })
    .select('id')
    .single();
  if (error || !data) return;
  redirect(`/fr/admin/titles/${data.id}`);
}
