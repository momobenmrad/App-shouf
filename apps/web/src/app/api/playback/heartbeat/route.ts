import { heartbeatSchema } from '@chouf/shared';
import { env } from '@/server/env';
import { isSameOrigin, json, jsonError, parseBody } from '@/server/http';
import { createServiceClient, createUserClient } from '@/server/supabase';
import { recordViewer } from '@/server/viewers';
import { getViewer } from '@/server/auth';
import { getActiveProfile } from '@/server/profile';

/** Keeps the playback session alive and saves the resume position. Also accepts sendBeacon. */
export async function POST(request: Request) {
  if (!isSameOrigin(request, env().APP_URL)) return jsonError(403, 'cross_origin');
  const body = await parseBody(request, heartbeatSchema);
  if (!body.ok) return body.response;

  const supabase = await createUserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError(401, 'auth_required');

  const db = createServiceClient();
  const { data: session } = await db
    .from('playback_sessions')
    .select('id, asset_id, channel_id, event_id, ended_at')
    .eq('id', body.data.sessionId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!session) return jsonError(404, 'session_not_found');
  // Another device took the slot (or the session was pruned): tell the player to stop.
  if (session.ended_at) return jsonError(409, 'session_ended');

  const now = new Date().toISOString();
  await db
    .from('playback_sessions')
    .update(body.data.ended ? { last_heartbeat_at: now, ended_at: now } : { last_heartbeat_at: now })
    .eq('id', session.id);

  // Live: count the viewer, nothing to resume.
  if (!session.asset_id) {
    if (!body.data.ended) {
      if (session.channel_id) await recordViewer('channel', session.channel_id, session.id);
      else if (session.event_id) await recordViewer('event', session.event_id, session.id);
    }
    return json({ ok: true });
  }

  // Title/episode for "continue watching", resolved server-side from the asset.
  const [{ data: title }, { data: episode }] = await Promise.all([
    db.from('titles').select('id').eq('asset_id', session.asset_id).maybeSingle(),
    db.from('episodes').select('id, seasons!inner(title_id)').eq('asset_id', session.asset_id).maybeSingle(),
  ]);
  const titleId = title?.id ?? (episode?.seasons as unknown as { title_id: string } | undefined)?.title_id;
  const profile = await getActiveProfile(await getViewer());
  if (titleId && profile) {
    const position = Math.floor(body.data.positionSeconds);
    const duration = body.data.durationSeconds ? Math.floor(body.data.durationSeconds) : null;
    await supabase.from('playback_progress').upsert({
      user_id: user.id,
      profile_id: profile.id,
      asset_id: session.asset_id,
      title_id: titleId,
      episode_id: episode?.id ?? null,
      position_seconds: position,
      duration_seconds: duration,
      completed: duration !== null && position >= duration * 0.95,
      updated_at: now,
    });
  }
  return json({ ok: true });
}
