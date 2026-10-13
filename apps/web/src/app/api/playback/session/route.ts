import { DENIAL_HTTP_STATUS, livePlaybackSessionSchema, playbackSessionSchema } from '@chouf/shared';
import { z } from 'zod';
import { countryFromHeaders } from '@/server/country';
import { env } from '@/server/env';
import { isSameOrigin, json, jsonError, parseBody } from '@/server/http';
import { startPlayback } from '@/server/playback';
import { createPlaybackRepo } from '@/server/playback-repo';
import { startLivePlayback } from '@/server/live';
import { createLiveRepo } from '@/server/live-repo';
import { createServiceClient, createUserClient } from '@/server/supabase';
import { getViewer } from '@/server/auth';
import { getActiveProfile } from '@/server/profile';

export async function POST(request: Request) {
  if (!isSameOrigin(request, env().APP_URL)) return jsonError(403, 'cross_origin');
  const body = await parseBody(request, z.union([playbackSessionSchema, livePlaybackSessionSchema]));
  if (!body.ok) return body.response;

  const supabase = await createUserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const country = countryFromHeaders(request.headers, env().DEFAULT_COUNTRY);

  if (!('titleId' in body.data)) {
    const live = await startLivePlayback(
      createLiveRepo(createServiceClient()),
      { userId: user?.id ?? null, channelId: body.data.channelId, eventId: body.data.eventId, deviceId: body.data.deviceId, country },
      { liveBaseUrl: env().LIVE_BASE_URL, signingSecret: env().PLAYBACK_SIGNING_SECRET, freeMaxStreams: env().FREE_MAX_STREAMS },
    );
    if (!live.ok) return jsonError(live.reason === 'offline' ? 409 : DENIAL_HTTP_STATUS[live.reason], live.reason);
    return json(live);
  }

  const profile = user ? await getActiveProfile(await getViewer()) : null;
  const result = await startPlayback(
    createPlaybackRepo(createServiceClient()),
    {
      userId: user?.id ?? null,
      profileId: profile?.id ?? null,
      titleId: body.data.titleId,
      episodeId: body.data.episodeId,
      deviceId: body.data.deviceId,
      country,
    },
    { vodBaseUrl: env().VOD_BASE_URL, signingSecret: env().PLAYBACK_SIGNING_SECRET, freeMaxStreams: env().FREE_MAX_STREAMS },
  );
  if (!result.ok) return jsonError(DENIAL_HTTP_STATUS[result.reason], result.reason);
  return json(result);
}
