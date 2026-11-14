import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Composition, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { Backdrop, Caption, Phone, Screen, Tap } from "../components";
import { C, cairo, FPS, inter, PHONE_W } from "../theme";
import { FlowMark, Logo, Nova } from "./Brand";
import {
  BUILD_APP,
  BUILD_COLORS,
  BUILD_NAME,
  BUILD_WIPE,
  CTA_BOX2,
  CTA_SEND2,
  E2,
  E2_LOOP_FADE,
  E2_SUBS,
  E2_TOTAL,
  ORDER_BIO_TAP,
  ORDER_BUY_TAP,
  ORDER_CHECKOUT,
  ORDER_CLOCK,
  ORDER_NOTIF,
  ORDER_PRODUCT,
  ORDER_SIZE_TAP,
  ORDER_SUCCESS,
} from "./ep2";
import { card, InstaScreen, phoneAt, Pill, SceneIn, usePop } from "./Video";
import { PRICE_DT } from "./timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const INSTA = { handle: "maison.nour", bio: "حوايج و إكسسوارات · توصيل لكل الولايات", link: "maison-nour.tn" };

const talkingAt = (frame: number) => {
  for (let i = E2_SUBS.length - 1; i >= 0; i--) {
    const [start, text] = E2_SUBS[i];
    if (frame >= start) {
      return frame - start < text.split(" ").length * 11 + 6;
    }
  }
  return false;
};

export const EpisodeBadge: React.FC = () => (
  <div dir="rtl" lang="ar" style={{ position: "absolute", top: 150, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
    <div style={{ padding: "8px 30px", borderRadius: 999, background: C.yellow, color: "#1c1917", fontFamily: cairo, fontWeight: 900, fontSize: 44, boxShadow: "0 10px 30px rgba(0,0,0,0.35)" }}>
      الحلقة 2
    </div>
  </div>
);

// ───────────────────────────── Hook: Instagram page → real shop (complete at frame 0)
const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const arrow = (frame % 30) / 30;
  return (
    <AbsoluteFill>
      <EpisodeBadge />
      <div
        dir="rtl"
        lang="ar"
        style={{ position: "absolute", top: 250, left: 40, right: 40, textAlign: "center", fontFamily: cairo, fontWeight: 900, fontSize: 92, lineHeight: 1.2, color: C.white, scale: String(1 + Math.sin(frame * 0.18) * 0.02) }}
      >
        من <span style={{ color: "#f472b6" }}>إنستغرام</span>
        <br />
        <span style={{ background: C.yellow, color: "#1c1917", padding: "0 20px", borderRadius: 24, display: "inline-block", rotate: "-2deg" }}>لمتجر حقيقي</span>
      </div>
      <Phone style={{ ...phoneAt(930, 0.42), translate: "-250px 0px", rotate: `${-5 + Math.sin(frame * 0.1) * 1.5}deg` }}>
        <InstaScreen {...INSTA} />
      </Phone>
      <Phone style={{ ...phoneAt(930, 0.42), translate: "250px 0px", rotate: `${5 + Math.sin(frame * 0.1 + 1) * 1.5}deg` }}>
        <Screen src="home-top.png" />
      </Phone>
      {/* animated arrow between the two phones */}
      <svg viewBox="0 0 160 80" width={180} height={90} style={{ position: "absolute", left: 450, top: 860, translate: `${interpolate(arrow, [0, 1], [-14, 14])}px 0px` }}>
        <path d="M10 40 H120 M95 15 L130 40 L95 65" stroke={C.yellow} strokeWidth="14" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <Nova size={200} talk={talkingAt(frame)} style={{ left: 440, top: 1080 }} />
    </AbsoluteFill>
  );
};

// ───────────────────────────── Before: selling by DMs only, customers waiting
export const WAITING: [string, string, number, number][] = [
  ["قدّاش السوم؟", "3h", 70, 520],
  ["مازال موجود؟", "5h", 650, 600],
  ["توصلو لسوسة؟", "1j", 60, 860],
  ["فما مقاس L؟", "8h", 640, 960],
];

const BeforeScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <SceneIn>
      <Phone style={phoneAt(860, 0.58)}>
        <InstaScreen {...INSTA} />
      </Phone>
      {WAITING.map(([msg, wait, x, y], i) => {
        const p = spring({ frame: frame - 40 - i * 14, fps: FPS, config: { damping: 12, stiffness: 200 } });
        return (
          <div
            key={msg}
            dir="rtl"
            lang="ar"
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 360,
              padding: "16px 22px",
              borderRadius: 28,
              background: "#fff",
              boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
              scale: String(p),
              rotate: `${(i % 2 ? 1 : -1) * 3}deg`,
            }}
          >
            <div style={{ fontFamily: cairo, fontWeight: 800, fontSize: 38, color: "#1c1917" }}>{msg}</div>
            <div style={{ fontFamily: inter, fontWeight: 700, fontSize: 26, color: "#dc2626" }}>⏳ {wait} · sans réponse</div>
          </div>
        );
      })}
    </SceneIn>
  );
};

// ───────────────────────────── Build: Flownova turns the page into a shop + app
export type BuildTiming = { wipe: readonly [number, number]; name: number; colors: number; app: number; talk: (frame: number) => boolean };
const BUILD_DEFAULT: BuildTiming = { wipe: BUILD_WIPE, name: BUILD_NAME, colors: BUILD_COLORS, app: BUILD_APP, talk: (f) => talkingAt(E2.build.from + f) };

export const BuildScene: React.FC<{ t?: BuildTiming }> = ({ t = BUILD_DEFAULT }) => {
  const frame = useCurrentFrame();
  const wipe = interpolate(frame, [t.wipe[0], t.wipe[1]], [0, 100], { ...clamp, easing: (t) => t * t * (3 - 2 * t) });
  const name = usePop(t.name);
  const colors = usePop(t.colors);
  const app = usePop(t.app, 220);
  const fly = interpolate(frame, [0, 44], [-300, 1200], clamp);
  return (
    <SceneIn>
      <Phone style={phoneAt(860, 0.58)}>
        <InstaScreen {...INSTA} />
        <AbsoluteFill style={{ clipPath: `inset(0 ${100 - wipe}% 0 0)` }}>
          <Screen src="home-top.png" />
        </AbsoluteFill>
        <div style={{ position: "absolute", top: 0, bottom: 0, left: `${wipe}%`, width: 10, background: C.yellow, boxShadow: "0 0 40px 12px rgba(253,224,71,0.8)", opacity: wipe > 0 && wipe < 100 ? 1 : 0 }} />
      </Phone>
      <Nova size={240} talk={t.talk(frame)} style={{ left: fly, top: 700, rotate: "12deg", opacity: frame < 46 ? 1 : 0 }} />
      <div style={{ position: "absolute", left: 60, top: 480, scale: String(name) }}>
        <div style={{ ...card, position: "relative", padding: "18px 24px", display: "flex", alignItems: "center", gap: 16, borderRadius: 26 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "#0f766e", color: "#fff", display: "grid", placeItems: "center", fontWeight: 900, fontSize: 36 }}>M</div>
          <span style={{ fontWeight: 900, fontSize: 34 }}>Maison Nour</span>
        </div>
      </div>
      <div style={{ position: "absolute", right: 70, top: 640, display: "flex", gap: 14, scale: String(colors) }}>
        {["#0f766e", "#1c1917", "#f5f5f4"].map((c) => (
          <div key={c} style={{ width: 74, height: 74, borderRadius: 99, background: c, border: "5px solid #fff", boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }} />
        ))}
      </div>
      <div style={{ position: "absolute", left: 90, top: 1010, textAlign: "center", scale: String(app), rotate: `${interpolate(app, [0, 1], [-25, 0])}deg` }}>
        <Img src={staticFile("shots/app-icon.png")} style={{ width: 150, height: 150, borderRadius: 38, boxShadow: "0 0 0 8px rgba(253,224,71,0.85), 0 20px 50px rgba(0,0,0,0.5)" }} />
        <div lang="ar" style={{ fontFamily: cairo, fontWeight: 900, fontSize: 44, color: C.white, marginTop: 6 }}>تطبيق</div>
      </div>
    </SceneIn>
  );
};

// ───────────────────────────── Order: bio link → product → size → buy → checkout → success
export type OrderTiming = { bioTap: number; product: number; sizeTap: number; buyTap: number; checkout: number; success: number; clock: readonly [number, number]; notif: number };
const ORDER_DEFAULT: OrderTiming = { bioTap: ORDER_BIO_TAP, product: ORDER_PRODUCT, sizeTap: ORDER_SIZE_TAP, buyTap: ORDER_BUY_TAP, checkout: ORDER_CHECKOUT, success: ORDER_SUCCESS, clock: ORDER_CLOCK, notif: ORDER_NOTIF };

export const OrderScene: React.FC<{ t?: OrderTiming }> = ({ t = ORDER_DEFAULT }) => {
  const frame = useCurrentFrame();
  const product = interpolate(frame, [t.product - 6, t.product], [0, 1], clamp);
  const checkout = interpolate(frame, [t.checkout - 5, t.checkout], [0, 1], clamp);
  const success = interpolate(frame, [t.success - 5, t.success], [0, 1], clamp);
  const secs = Math.round(interpolate(frame, [t.clock[0], t.clock[1]], [0, 52], clamp));
  const done = frame >= t.clock[1];
  const clockPop = usePop(t.clock[1], 260);
  const notif = usePop(t.notif, 170);
  return (
    <SceneIn>
      <div style={{ position: "absolute", top: 150, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "14px 34px",
            borderRadius: 999,
            background: done ? C.brand : "rgba(255,255,255,0.12)",
            border: "2px solid rgba(255,255,255,0.25)",
            color: done ? "#04211d" : C.white,
            fontFamily: inter,
            fontWeight: 900,
            fontSize: 58,
            scale: String(done ? interpolate(clockPop, [0, 1], [1.3, 1]) : 1),
          }}
        >
          <svg viewBox="0 0 24 24" width={52} height={52}>
            <circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" strokeWidth="2.4" />
            <path d="M12 13 L12 8 M9 2 H15" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
          0:{String(secs).padStart(2, "0")}
          {done ? <span lang="ar" style={{ fontFamily: cairo, fontSize: 42 }}>أقل من دقيقة ✓</span> : null}
        </div>
      </div>
      <Phone style={phoneAt(870, 0.6)}>
        <InstaScreen {...INSTA}>
          <Tap x={150} y={330} at={t.bioTap} />
        </InstaScreen>
        <AbsoluteFill style={{ opacity: product, translate: `${(1 - product) * PHONE_W}px 0px` }}>
          <Screen src="product-0.png" />
          {frame >= t.sizeTap + 2 ? (
            <div style={{ position: "absolute", left: (76 * PHONE_W) / 390, top: (486 * PHONE_W) / 390, width: (52 * PHONE_W) / 390, height: (43 * PHONE_W) / 390, borderRadius: 10, border: "5px solid #1c1917", boxSizing: "border-box" }} />
          ) : null}
          <Tap x={102} y={507} at={t.sizeTap} />
          <Tap x={195} y={679} at={t.buyTap} />
        </AbsoluteFill>
        <AbsoluteFill style={{ opacity: checkout, translate: `${(1 - checkout) * PHONE_W}px 0px`, background: "#fbfaf8" }}>
          <Screen src="checkout-full.png" y={interpolate(frame, [t.checkout + 4, t.success - 8], [0, 1080], { ...clamp, easing: (t) => t * t * (3 - 2 * t) })} />
        </AbsoluteFill>
        <AbsoluteFill style={{ opacity: success, scale: String(interpolate(success, [0, 1], [1.08, 1])) }}>
          <Screen src="success.png" />
        </AbsoluteFill>
      </Phone>
      <div
        style={{
          ...card,
          left: 110,
          top: 1110,
          width: 860,
          padding: "22px 28px",
          display: "flex",
          alignItems: "center",
          gap: 22,
          borderRadius: 28,
          opacity: interpolate(notif, [0, 0.4], [0, 1], clamp),
          translate: `0px ${interpolate(notif, [0, 1], [120, 0])}px`,
        }}
      >
        <FlowMark size={74} />
        <div>
          <div style={{ fontSize: 24, color: "#78716c", fontWeight: 600 }}>Nouvelle commande · Démo</div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>CMD-10006 — 125,900 DT</div>
        </div>
      </div>
    </SceneIn>
  );
};

// ───────────────────────────── CTA
export type CtaTiming = { box: number; send: number; teaser: boolean; talk: (frame: number) => boolean };
const CTA_DEFAULT: CtaTiming = { box: CTA_BOX2, send: CTA_SEND2, teaser: true, talk: (f) => talkingAt(E2.cta.from + f) };

export const CtaScene: React.FC<{ t?: CtaTiming }> = ({ t = CTA_DEFAULT }) => {
  const frame = useCurrentFrame();
  const logo = usePop(2, 140);
  const box = usePop(t.box, 160);
  const typed = "Flownova".slice(0, Math.max(0, Math.floor((frame - t.box - 10) / 3)));
  const sent = usePop(t.send, 220);
  const next = usePop(t.send + 10, 160);
  return (
    <SceneIn>
      <div style={{ position: "absolute", top: 170, left: 0, right: 0, display: "flex", justifyContent: "center", scale: String(logo) }}>
        <Logo size={92} />
      </div>
      <div style={{ position: "absolute", top: 330, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 18, flexWrap: "wrap", padding: "0 60px" }}>
        {["متجر + تطبيق", `من ${PRICE_DT} DT`, "بلاش اشتراك"].map((t, i) => {
          const p = spring({ frame: frame - 10 - i * 6, fps: FPS, config: { damping: 12, stiffness: 200 } });
          return (
            <div key={t} dir="rtl" lang="ar" style={{ padding: "10px 30px", borderRadius: 999, background: "rgba(255,255,255,0.12)", border: "2px solid rgba(255,255,255,0.25)", color: C.white, fontFamily: cairo, fontWeight: 800, fontSize: 40, scale: String(p) }}>
              {t}
            </div>
          );
        })}
      </div>
      <Nova size={420} wave talk={t.talk(frame)} style={{ left: 330, top: 470 }} />
      <div style={{ ...card, left: 90, top: 1000, width: 900, padding: "22px 26px", display: "flex", alignItems: "center", gap: 20, borderRadius: 999, scale: String(box) }}>
        <div style={{ width: 70, height: 70, borderRadius: 99, background: "#fecdd3", flexShrink: 0 }} />
        <div style={{ flex: 1, fontSize: 44, fontWeight: 800, color: typed ? "#1c1917" : "#a8a29e" }}>
          {typed || "Ajouter un commentaire…"}
          {typed && typed.length < 8 && frame % 16 < 8 ? "|" : ""}
        </div>
        <div style={{ width: 76, height: 76, borderRadius: 99, background: frame >= t.send ? "#fe2c55" : "#e7e5e4", display: "grid", placeItems: "center", scale: String(interpolate(sent, [0, 1], [1.3, 1])) }}>
          <svg viewBox="0 0 24 24" width={40} height={40}>
            <path d="M4 12l16-8-6 16-2-6z" fill="#fff" />
          </svg>
        </div>
      </div>
      {t.teaser ? <div dir="rtl" lang="ar" style={{ position: "absolute", top: 1170, left: 0, right: 0, display: "flex", justifyContent: "center", scale: String(next) }}>
        <Pill text="الحلقة 3 قريب… تابعني 👀" bg={C.yellow} fg="#1c1917" style={{ fontFamily: cairo, fontSize: 40, padding: "8px 30px" }} />
      </div> : null}
    </SceneIn>
  );
};

const Subtitles: React.FC = () => (
  <>
    {E2_SUBS.map(([start, text], i) => {
      const end = i + 1 < E2_SUBS.length ? E2_SUBS[i + 1][0] : E2_TOTAL - E2_LOOP_FADE;
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

export const FlownovaEp2: React.FC = () => {
  const frame = useCurrentFrame();
  const scenes: [keyof typeof E2, React.FC][] = [
    ["hook", HookScene],
    ["before", BeforeScene],
    ["build", BuildScene],
    ["order", OrderScene],
    ["cta", CtaScene],
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Backdrop />
      {scenes.map(([key, Scene]) => (
        <Sequence key={key} from={E2[key].from} durationInFrames={E2[key].duration} premountFor={30}>
          <Scene />
        </Sequence>
      ))}
      <Subtitles />
      {/* seamless loop: the opening image dissolves back in */}
      <Sequence from={E2_TOTAL - E2_LOOP_FADE} durationInFrames={E2_LOOP_FADE}>
        <AbsoluteFill style={{ opacity: interpolate(frame, [E2_TOTAL - E2_LOOP_FADE, E2_TOTAL - 2], [0, 1], clamp) }}>
          <Backdrop />
          <HookScene />
          <div lang="ar">
            <Caption text={E2_SUBS[0][1]} top={1340} size={64} stagger={3} delay={-14} fontFamily={cairo} dir="rtl" />
          </div>
        </AbsoluteFill>
      </Sequence>
      <Audio src={staticFile("audio/flownova_ep2_full.wav")} />
    </AbsoluteFill>
  );
};

export const FlownovaEp2Composition: React.FC = () => (
  <Composition id="FlownovaEp2" component={FlownovaEp2} durationInFrames={E2_TOTAL} fps={FPS} width={1080} height={1920} />
);
