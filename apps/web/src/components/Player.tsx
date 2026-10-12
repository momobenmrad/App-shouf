'use client';

import type Hls from 'hls.js';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { getDeviceId } from '@/lib/device';

interface Session {
  url: string;
  sessionId: string;
  resumeAt: number;
  durationSeconds: number | null;
}

const HEARTBEAT_MS = 15_000;
const ERROR_KEYS = ['auth_required', 'subscription_required', 'geo_blocked', 'too_many_streams', 'not_ready', 'not_found', 'session_ended'] as const;
type ErrorKey = (typeof ERROR_KEYS)[number] | 'generic';

export function Player({ titleId, episodeId, heading, backHref }: { titleId: string; episodeId?: string; heading: string; backHref: string }) {
  const t = useTranslations('player');
  const tNav = useTranslations('nav');
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const [error, setError] = useState<ErrorKey | null>(null);
  const [levels, setLevels] = useState<{ index: number; height: number }[]>([]);
  const [level, setLevel] = useState(-1);

  const sendHeartbeat = useCallback((ended = false, beacon = false) => {
    const video = videoRef.current;
    const session = sessionRef.current;
    if (!video || !session) return;
    const body = JSON.stringify({
      sessionId: session.sessionId,
      positionSeconds: video.currentTime || 0,
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

    async function start() {
      const res = await fetch('/api/playback/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titleId, episodeId, deviceId: getDeviceId() }),
      });
      const data = (await res.json().catch(() => ({}))) as Partial<Session> & { error?: string };
      if (cancelled) return;
      if (!res.ok || !data.url) {
        setError((ERROR_KEYS as readonly string[]).includes(data.error ?? '') ? (data.error as ErrorKey) : 'generic');
        return;
      }
      sessionRef.current = data as Session;
      const seek = () => {
        if (data.resumeAt) video.currentTime = data.resumeAt;
      };

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = data.url; // Safari / iOS: native HLS
        video.addEventListener('loadedmetadata', seek, { once: true });
      } else {
        const { default: HlsLib } = await import('hls.js');
        if (cancelled) return;
        if (!HlsLib.isSupported()) {
          setError('generic');
          return;
        }
        const hls = new HlsLib({ capLevelToPlayerSize: true, startPosition: data.resumeAt || -1 });
        hlsRef.current = hls;
        hls.on(HlsLib.Events.MANIFEST_PARSED, (_e, info) => {
          setLevels(info.levels.map((l, index) => ({ index, height: l.height })).sort((a, b) => b.height - a.height));
        });
        hls.on(HlsLib.Events.ERROR, (_e, info) => {
          if (!info.fatal) return;
          if (info.type === HlsLib.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
          else setError('generic');
        });
        hls.loadSource(data.url);
        hls.attachMedia(video);
      }
      video.play().catch(() => undefined); // autoplay may be blocked; controls stay available
    }

    start().catch(() => !cancelled && setError('generic'));

    const timer = setInterval(() => {
      if (!video.paused) sendHeartbeat();
    }, HEARTBEAT_MS);
    const onPause = () => sendHeartbeat();
    const onEnded = () => sendHeartbeat(true);
    const onHide = () => sendHeartbeat(false, true);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    window.addEventListener('pagehide', onHide);

    return () => {
      cancelled = true;
      clearInterval(timer);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
      window.removeEventListener('pagehide', onHide);
      if (sessionRef.current) sendHeartbeat(true, true);
      hlsRef.current?.destroy();
      hlsRef.current = null;
      sessionRef.current = null;
    };
  }, [titleId, episodeId, sendHeartbeat]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 px-4 sm:px-0">
        <Link href={backHref} className="text-sm text-muted hover:text-white">
          ← {t('back')}
        </Link>
        <h1 className="line-clamp-1 flex-1 text-lg font-bold">{heading}</h1>
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
          </div>
        )}
      </div>
    </div>
  );
}
