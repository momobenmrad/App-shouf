import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Composition, interpolate, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { Backdrop, Caption, Phone } from "../components";
import { C, cairo, FPS, inter } from "../theme";
import { BuildScene, CtaScene, EpisodeBadge, INSTA, OrderScene, WAITING } from "./Episode2";
import { InstaScreen, phoneAt } from "./Video";

// "FlownovaEp2Short": 15 s TikTok cut of episode 2. The seller's pain comes first (customers
// waiting for a reply), then the shop, an order in under a minute and the call to action.
// Voice: four slices of public/audio/flownova/ep2-voice.mp3 cut on its word timestamps into
// public/audio/flownova/ep2-short-voice.wav (see audio/make_audio_flownova_ep2_short.py).
export const S2 = {
  hook: { from: 0, duration: 67 }, // "و الكليانات يستناو في الرد…"
  build: { from: 67, duration: 136 }, // "Flownova يصنعلها متجر…"
  order: { from: 203, duration: 157 }, // "توّا الكليانة تدخل من البيو…"
  cta: { from: 360, duration: 90 }, // "اكتب Flownova في الكومنتار"
} as const;
export const S2_TOTAL = 450;
const LOOP_FADE = 15;

const SUBS: [number, string][] = [
  [0, "و الكليانات *يستناو* في الرد…"],
  [69, "*Flownova* يصنعلها متجر *بإسمها*"],
  [131, "و *بألوانها…* و *تطبيق* في التليفون"],
  [203, "توّا الكليانة تدخل من *البيو*"],
  [253, "تختار المقاس، و *تكومندي…*"],
  [311, "في *أقل_من_دقيقة!*"],
  [362, "اكتب *Flownova* في الكومنتار"],
];

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const talkingAt = (frame: number) => {
  for (let i = SUBS.length - 1; i >= 0; i--) {
    const [start, text] = SUBS[i];
    if (frame >= start) {
      return frame - start < text.split(" ").length * 11 + 6;
    }
  }
  return false;
};

/** Frame 0 is complete: the Instagram page buried under unanswered DMs. */
const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ scale: String(1 + frame * 0.0012) }}>
      <EpisodeBadge />
      <div dir="rtl" lang="ar" style={{ position: "absolute", top: 240, left: 40, right: 40, textAlign: "center", fontFamily: cairo, fontWeight: 900, fontSize: 92, lineHeight: 1.2, color: C.white }}>
        تبيع على{" "}
        <span style={{ background: C.yellow, color: "#1c1917", padding: "0 20px", borderRadius: 24, display: "inline-block", rotate: "-2deg" }}>إنستغرام؟</span>
      </div>
      <Phone style={phoneAt(900, 0.5)}>
        <InstaScreen {...INSTA} />
      </Phone>
      <div
        style={{
          position: "absolute", left: 640, top: 520, padding: "8px 22px", borderRadius: 999, background: "#ef4444", color: "#fff",
          fontFamily: inter, fontWeight: 900, fontSize: 48, boxShadow: "0 12px 40px rgba(239,68,68,0.5)",
          scale: String(1 + Math.max(0, Math.sin(frame * 0.35)) * 0.12),
        }}
      >
        99+
      </div>
      {WAITING.map(([msg, wait, x, y], i) => {
        // Already on screen at frame 0, then each bubble shakes like a new notification.
        const p = spring({ frame: frame + 20 - i * 3, fps: FPS, config: { damping: 12, stiffness: 200 } });
        const shake = Math.sin((frame - i * 9) * 1.4) * (((frame + i * 9) % 30) < 6 ? 4 : 0);
        return (
          <div
            key={msg}
            dir="rtl"
            lang="ar"
            style={{
              position: "absolute", left: x, top: y + 80, width: 360, padding: "16px 22px", borderRadius: 28, background: "#fff",
              boxShadow: "0 16px 40px rgba(0,0,0,0.4)", scale: String(p), rotate: `${(i % 2 ? 1 : -1) * 3 + shake}deg`,
            }}
          >
            <div style={{ fontFamily: cairo, fontWeight: 800, fontSize: 38, color: "#1c1917" }}>{msg}</div>
            <div style={{ fontFamily: inter, fontWeight: 700, fontSize: 26, color: "#dc2626" }}>⏳ {wait} · sans réponse</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Subtitles: React.FC = () => (
  <>
    {SUBS.map(([start, text], i) => {
      const end = i + 1 < SUBS.length ? SUBS[i + 1][0] : S2_TOTAL - LOOP_FADE;
      return (
        <Sequence key={start} from={start} durationInFrames={end - start} layout="none">
          <div lang="ar">
            <Caption text={text} top={1340} size={64} stagger={3} delay={i === 0 ? -14 : 0} fontFamily={cairo} dir="rtl" />
          </div>
        </Sequence>
      );
    })}
  </>
);

export const FlownovaEp2Short: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Backdrop />
      <Sequence from={S2.hook.from} durationInFrames={S2.hook.duration}>
        <HookScene />
      </Sequence>
      <Sequence from={S2.build.from} durationInFrames={S2.build.duration} premountFor={30}>
        <BuildScene t={{ wipe: [4, 36], name: 48, colors: 68, app: 99, talk: (f) => talkingAt(S2.build.from + f) }} />
      </Sequence>
      <Sequence from={S2.order.from} durationInFrames={S2.order.duration} premountFor={30}>
        <OrderScene t={{ bioTap: 33, product: 40, sizeTap: 62, buyTap: 86, checkout: 90, success: 116, clock: [24, 116], notif: 132 }} />
      </Sequence>
      <Sequence from={S2.cta.from} durationInFrames={S2.cta.duration} premountFor={30}>
        <CtaScene t={{ box: 2, send: 63, teaser: false, talk: (f) => talkingAt(S2.cta.from + f) }} />
      </Sequence>
      <Subtitles />
      <Sequence from={S2_TOTAL - LOOP_FADE} durationInFrames={LOOP_FADE}>
        <AbsoluteFill style={{ opacity: interpolate(frame, [S2_TOTAL - LOOP_FADE, S2_TOTAL - 2], [0, 1], clamp) }}>
          <Backdrop />
          <HookScene />
          <div lang="ar">
            <Caption text={SUBS[0][1]} top={1340} size={64} stagger={3} delay={-14} fontFamily={cairo} dir="rtl" />
          </div>
        </AbsoluteFill>
      </Sequence>
      <Audio src={staticFile("audio/flownova_ep2_short_full.wav")} />
    </AbsoluteFill>
  );
};

export const FlownovaEp2ShortComposition: React.FC = () => (
  <Composition id="FlownovaEp2Short" component={FlownovaEp2Short} durationInFrames={S2_TOTAL} fps={FPS} width={1080} height={1920} />
);
