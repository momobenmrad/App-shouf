import { DENIAL_HTTP_STATUS, playbackSessionSchema } from '@chouf/shared';
import { countryFromHeaders } from '@/server/country';
import { env } from '@/server/env';
import { isSameOrigin, json, jsonError, parseBody } from '@/server/http';
import { startPlayback } from '@/server/playback';
import { createPlaybackRepo } from '@/server/playback-repo';
import { createServiceClient, createUserClient } from '@/server/supabase';

export async function POST(request: Request) {
  if (!isSameOrigin(request, env().APP_URL)) return jsonError(403, 'cross_origin');
  const body = await parseBody(request, playbackSessionSchema);
  if (!body.ok) return body.response;

  const supabase = await createUserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const result = await startPlayback(
    createPlaybackRepo(createServiceClient()),
    {
      userId: user?.id ?? null,
      titleId: body.data.titleId,
      episodeId: body.data.episodeId,
      deviceId: body.data.deviceId,
      country: countryFromHeaders(request.headers, env().DEFAULT_COUNTRY),
    },
    { vodBaseUrl: env().VOD_BASE_URL, signingSecret: env().PLAYBACK_SIGNING_SECRET, freeMaxStreams: env().FREE_MAX_STREAMS },
  );
  if (!result.ok) return jsonError(DENIAL_HTTP_STATUS[result.reason], result.reason);
  return json(result);
}
