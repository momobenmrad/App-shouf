'use client';

import type Hls from 'hls.js';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { getDeviceId } from '@/lib/device';

export type PlayerTarget = { kind: 'vod'; titleId: string; episodeId?: string } | { kind: 'channel'; channelId: string } | { kind: 'event'; eventId: string };

interface Session {
  url: string;
  sessionId: string;
  resumeAt?: number;
  durationSeconds?: number | null;
}

const HEARTBEAT_MS = 15_000;
const VIEWERS_POLL_MS = 10_000;
const ERROR_KEYS = ['auth_required', 'subscription_required', 'geo_blocked', 'too_many_streams', 'not_ready', 'not_found', 'session_ended', 'offline'] as const;
type ErrorKey = (typeof ERROR_KEYS)[number] | 'generic';

export function Player({ target, heading, backHref }: { target: PlayerTarget; heading: string; backHref: string }) {
  const t = useTranslations('player');
  const tNav = useTranslations('nav');
  const live = target.kind !== 'vod';
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const [error, setError] = useState<ErrorKey | null>(null);
  const [levels, setLevels] = useState<{ index: number; height: number }[]>([]);
  const [level, setLevel] = useState(-1);
  const [viewers, setViewers] = useState<number | null>(null);
  const targetKey = JSON.stringify(target);

  const sendHeartbeat = useCallback((ended = false, beacon = false) => {
    const video = videoRef.current;
    const session = sessionRef.current;
    if (!video || !session) return;
    const body = JSON.stringify({
      sessionId: session.sessionId,
      positionSeconds: Number.isFinite(video.currentTime) ? Math.max(0, video.currentTime) : 0,
      durationSeconds: Number.isFinite(video.duration) ? video.duration : undefined,
      ended,
    });
    if (beacon && navigator.sendBeacon) {
      navigator.sendBeacon('/api/playback/heartbeat', new Blob([body], { type: 'application/json' }));
      return;
    }
    void fetch('/api/playback/heartbeat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).then(
      (res) => {
        if (res.status === 409) {
          video.pause();
          setError('session_ended');
        }
      },
      () => undefined,
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    const video = videoRef.current!;
    const parsed = JSON.parse(targetKey) as PlayerTarget;

    async function start() {
      const payload =
        parsed.kind === 'vod'
          ? { titleId: parsed.titleId, episodeId: parsed.episodeId, deviceId: getDeviceId() }
          : parsed.kind === 'channel'
            ? { channelId: parsed.channelId, deviceId: getDeviceId() }
            : { eventId: parsed.eventId, deviceId: getDeviceId() };
      const res = await fetch('/api/playback/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = (await res.json().catch(() => ({}))) as Partial<Session> & { error?: string };
      if (cancelled) return;
      if (!res.ok || !data.url) {
        setError((ERROR_KEYS as readonly string[]).includes(data.error ?? '') ? (data.error as ErrorKey) : 'generic');
        return;
      }
      sessionRef.current = data as Session;
      const resumeAt = data.resumeAt ?? 0;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = data.url; // Safari / iOS: native HLS
        if (resumeAt) video.addEventListener('loadedmetadata', () => void (video.currentTime = resumeAt), { once: true });
      } else {
        const { default: HlsLib } = await import('hls.js');
        if (cancelled) return;
        if (!HlsLib.isSupported()) {
          setError('generic');
          return;
        }
        const hls = new HlsLib(
          live
            ? { capLevelToPlayerSize: true, liveSyncDurationCount: 3, liveMaxLatencyDurationCount: 8, lowLatencyMode: false }
            : { capLevelToPlayerSize: true, startPosition: resumeAt || -1 },
        );
        hlsRef.current = hls;
        hls.on(HlsLib.Events.MANIFEST_PARSED, (_e, info) => {
          setLevels(info.levels.map((l, index) => ({ index, height: l.height })).sort((a, b) => b.height - a.height));
        });
        let retries = 0;
        hls.on(HlsLib.Events.ERROR, (_e, info) => {
          if (!info.fatal) return;
          if (info.type === HlsLib.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
          else if (live && info.type === HlsLib.ErrorTypes.NETWORK_ERROR && retries++ < 10) setTimeout(() => hls.loadSource(data.url!), 3000); // source switch or hiccup
          else setError(live ? 'offline' : 'generic');
        });
        hls.loadSource(data.url);
        hls.attachMedia(video);
      }
      video.play().catch(() => undefined); // autoplay may be blocked; controls stay available
    }

    start().catch(() => !cancelled && setError('generic'));

    const timer = setInterval(() => {
      if (!video.paused || live) sendHeartbeat();
    }, HEARTBEAT_MS);
    const onPause = () => sendHeartbeat();
    const onEnded = () => sendHeartbeat(true);
    const onHide = () => sendHeartbeat(false, true);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    window.addEventListener('pagehide', onHide);

    let viewersTimer: ReturnType<typeof setInterval> | undefined;
    if (parsed.kind !== 'vod') {
      const q = parsed.kind === 'channel' ? `channel=${parsed.channelId}` : `event=${parsed.eventId}`;
      const poll = () =>
        fetch(`/api/live/viewers?${q}`)
          .then((r) => r.json() as Promise<{ count?: number }>)
          .then((d) => !cancelled && typeof d.count === 'number' && setViewers(d.count))
          .catch(() => undefined);
      void poll();
      viewersTimer = setInterval(poll, VIEWERS_POLL_MS);
    }

    return () => {
      cancelled = true;
      clearInterval(timer);
      if (viewersTimer) clearInterval(viewersTimer);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
      window.removeEventListener('pagehide', onHide);
      if (sessionRef.current) sendHeartbeat(true, true);
      hlsRef.current?.destroy();
      hlsRef.current = null;
      sessionRef.current = null;
    };
  }, [targetKey, live, sendHeartbeat]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 px-4 sm:px-0">
        <Link href={backHref} className="text-sm text-muted hover:text-white">
          ← {t('back')}
        </Link>
        <h1 className="line-clamp-1 flex-1 text-lg font-bold">{heading}</h1>
        {live && (
          <span className="flex items-center gap-2 text-xs">
            <span className="rounded bg-brand px-1.5 py-0.5 font-bold uppercase">{t('live')}</span>
            {viewers !== null && <span className="text-muted">{t('viewers', { count: viewers })}</span>}
          </span>
        )}
        {levels.length > 1 && (
          <label className="flex items-center gap-2 text-sm text-muted">
            {t('quality')}
            <select
              value={level}
              onChange={(e) => {
                const next = Number(e.target.value);
                setLevel(next);
                if (hlsRef.current) hlsRef.current.currentLevel = next;
              }}
              className="rounded border border-line bg-panel px-2 py-1 text-white"
            >
              <option value={-1}>{t('auto')}</option>
              {levels.map((l) => (
                <option key={l.index} value={l.index}>
                  {l.height}p
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="relative aspect-video w-full overflow-hidden bg-black sm:rounded-lg">
        {/* Video controls stay LTR: the timeline reads left-to-right in every locale. */}
        <video ref={videoRef} controls playsInline dir="ltr" className="h-full w-full" />
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/85 p-6 text-center">
            <p className="max-w-md text-lg">{t(`errors.${error}`)}</p>
            {error === 'subscription_required' && (
              <Link href="/subscribe" className="rounded-md bg-brand px-5 py-2 font-semibold hover:bg-brand-dark">
                {tNav('subscribe')}
              </Link>
            )}
            {error === 'auth_required' && (
              <Link href="/login" className="rounded-md bg-brand px-5 py-2 font-semibold hover:bg-brand-dark">
                {tNav('login')}
              </Link>
            )}
            {error === 'offline' && (
              <button onClick={() => window.location.reload()} className="rounded-md bg-white/15 px-5 py-2 font-semibold hover:bg-white/25">
                {t('retry')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
