import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Composition, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { Backdrop, Caption, Phone } from "../components";
import { C, FPS, inter } from "../theme";
import { Logo } from "../flownova/Brand";
import { card, dt, phoneAt, usePop } from "../flownova/Video";
import { PHONE_SAFE } from "../flownova/safe";
import { E3_LOOP_FADE, E3_SUBS, E3_TOTAL, T } from "./timeline";

// Episode 3: "It's 2 am, you're asleep… your customer orders". Night → order notifications on the
// lock screen → morning with three orders → last day of the 590 DT offer. Inside the TikTok safe zone.
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const ORDERS: { at: number; time: string; num: string; amount: number }[] = [
  { at: T.ding - 4, time: "02:14", num: "CMD-10031", amount: 89000 },
  { at: T.mail + 10, time: "03:40", num: "CMD-10032", amount: 146000 },
  { at: T.morning - 8, time: "06:05", num: "CMD-10033", amount: 80000 },
];

/** Clock shown above the phone: 02:14 → 03:40 → 06:05 → 07:30. */
const clockAt = (frame: number) => (frame >= T.morning ? "07:30" : frame >= ORDERS[2].at ? "06:05" : frame >= ORDERS[1].at ? "03:40" : "02:14");

const Sky: React.FC = () => {
  const frame = useCurrentFrame();
  const day = interpolate(frame, [T.morning - 10, T.morning + 20], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ background: "linear-gradient(180deg,#0b1026 0%,#141a3c 55%,#07110f 100%)", opacity: 1 - day * 0.85 }} />
      {Array.from({ length: 40 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", left: (i * 211) % 1080, top: 80 + ((i * 137) % 900), width: 4, height: 4, borderRadius: 4, background: "#fff", opacity: (0.3 + 0.7 * Math.abs(Math.sin(frame * 0.08 + i))) * (1 - day) }} />
      ))}
      <div style={{ position: "absolute", right: 150, top: 300, width: 120, height: 120, borderRadius: 99, boxShadow: "inset -26px 10px 0 0 #f1e7c6", opacity: 1 - day, rotate: "-20deg" }} />
      <AbsoluteFill style={{ background: "radial-gradient(900px 600px at 50% 0%, rgba(253,186,116,0.55), transparent 70%)", opacity: day }} />
    </AbsoluteFill>
  );
};

const LockScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const day = interpolate(frame, [T.morning - 10, T.morning + 20], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${day > 0.5 ? "#f59e0b" : "#1e1b4b"} 0%, ${day > 0.5 ? "#7c2d12" : "#0f172a"} 100%)`, fontFamily: inter, color: "#fff" }}>
      <div style={{ textAlign: "center", marginTop: 150, fontSize: 32, fontWeight: 600, opacity: 0.85 }}>mercredi 28 octobre</div>
      <div style={{ textAlign: "center", fontSize: 150, fontWeight: 300, letterSpacing: -4, lineHeight: 1.1 }}>{clockAt(frame)}</div>
      <div style={{ position: "absolute", left: 28, right: 28, top: 420, display: "flex", flexDirection: "column", gap: 22 }}>
        {ORDERS.filter((o) => frame >= o.at).reverse().map((o) => {
          const p = spring({ frame: frame - o.at, fps: FPS, config: { damping: 14, stiffness: 200 } });
          return (
            <div key={o.num} style={{ display: "flex", gap: 18, alignItems: "center", padding: "20px 22px", borderRadius: 30, background: "rgba(255,255,255,0.88)", color: "#111", opacity: p, translate: `0px ${interpolate(p, [0, 1], [-50, 0])}px` }}>
              <Img src={staticFile("shots/app-icon.png")} style={{ width: 86, height: 86, borderRadius: 20 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, color: "#555", fontWeight: 600 }}>
                  <span>MA BOUTIQUE</span><span>{o.time}</span>
                </div>
                <div style={{ fontSize: 38, fontWeight: 800 }}>Nouvelle commande</div>
                <div style={{ fontSize: 34, color: "#333", fontWeight: 600 }}>{o.num} · {dt(o.amount / 1000)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Badge: React.FC = () => (
  <div style={{ position: "absolute", top: PHONE_SAFE.top + 10, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
    <div style={{ padding: "10px 28px", borderRadius: 999, background: C.yellow, color: "#1c1917", fontFamily: inter, fontWeight: 900, fontSize: 38, letterSpacing: 3, boxShadow: "0 10px 30px rgba(0,0,0,0.35)" }}>ÉPISODE 3</div>
  </div>
);

const Check: React.FC<{ label: string; at: number; top: number }> = ({ label, at, top }) => {
  const p = usePop(at, 220);
  return (
    <div style={{ position: "absolute", top, left: PHONE_SAFE.left, width: PHONE_SAFE.width, display: "flex", justifyContent: "center", scale: String(p) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 28px", borderRadius: 999, background: "rgba(20,184,166,0.95)", color: "#04211d", fontFamily: inter, fontWeight: 900, fontSize: 40 }}>✓ {label}</div>
    </div>
  );
};

const Main: React.FC = () => {
  const frame = useCurrentFrame();
  const phoneIn = usePop(0, 140);
  const offer = frame >= T.offer;
  const morningCard = usePop(T.morning + 18, 180);
  const total = ORDERS.reduce((s, o) => s + o.amount, 0);
  const count = interpolate(frame, [T.morning + 18, T.morning + 50], [0, 1], { ...clamp, easing: (t) => 1 - (1 - t) ** 3 });
  const hide = interpolate(frame, [T.offer - 6, T.offer + 4], [1, 0], clamp);
  return (
    <AbsoluteFill>
      <Sky />
      <Badge />
      <div style={{ opacity: hide }}>
        <div style={{ position: "absolute", top: PHONE_SAFE.top + 90, left: 0, right: 0, textAlign: "center", fontFamily: inter, fontWeight: 900, fontSize: 64, color: C.white }}>
          {frame < T.morning ? "Pendant que tu dors… 😴" : "Au réveil ☀️"}
        </div>
        <Phone style={{ ...phoneAt(880, 0.62), translate: `0px ${interpolate(phoneIn, [0, 1], [60, 0])}px` }}>
          <LockScreen />
        </Phone>
        <Check label="Stock mis à jour" at={T.stock} top={1240} />
        {frame >= T.mail && frame < T.morning ? <Check label="E-mail envoyé" at={T.mail} top={1240} /> : null}
        {frame >= T.morning ? (
          <div style={{ ...card, left: PHONE_SAFE.left + 40, top: 1180, width: PHONE_SAFE.width - 80, padding: "18px 26px", textAlign: "center", scale: String(morningCard) }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: "#57534e" }}>Ventes de la nuit · 3 commandes</div>
            <div style={{ fontSize: 66, fontWeight: 900, color: "#0f766e" }}>{dt((total / 1000) * count)}</div>
          </div>
        ) : null}
      </div>
      {offer ? <Offer /> : null}
    </AbsoluteFill>
  );
};

const Offer: React.FC = () => {
  const frame = useCurrentFrame() - T.offer;
  const p = usePop(T.offer + 4, 200);
  return (
    <>
      <div style={{ position: "absolute", top: PHONE_SAFE.top + 140, left: 0, right: 0, display: "flex", justifyContent: "center", scale: String(usePop(T.offer, 160)) }}>
        <Logo size={96} />
      </div>
      <div style={{ ...card, left: PHONE_SAFE.left + 20, top: 600, width: PHONE_SAFE.width - 40, padding: "36px 24px", textAlign: "center", background: "#0d1222", color: "#fff", border: "3px solid #b8955a", scale: String(p) }}>
        <div style={{ fontWeight: 900, fontSize: 50 }}>🔥 Dernier jour</div>
        <div style={{ fontWeight: 900, fontSize: 120, color: C.yellow, letterSpacing: -3, lineHeight: 1.1 }}>590 DT</div>
        <div style={{ fontWeight: 700, fontSize: 32, color: "rgba(255,255,255,0.75)" }}>au lieu de 690 DT · jusqu'à ce soir 23h59</div>
      </div>
      <div style={{ position: "absolute", top: 1060, left: 0, right: 0, textAlign: "center", fontFamily: inter, fontWeight: 900, fontSize: 56, color: C.white, opacity: interpolate(frame, [T.cta - T.offer - 6, T.cta - T.offer + 4], [0, 1], clamp) }}>
        Commente « <span style={{ color: C.yellow }}>Flownova</span> » 👇
      </div>
    </>
  );
};

const Subtitles: React.FC = () => (
  <>
    {E3_SUBS.map(([start, text], i) => {
      const end = i + 1 < E3_SUBS.length ? E3_SUBS[i + 1][0] : E3_TOTAL - E3_LOOP_FADE;
      return (
        <Sequence key={start} from={start} durationInFrames={end - start} layout="none">
          <Caption text={text} top={1360} size={58} stagger={3} delay={i === 0 ? -14 : 0} />
        </Sequence>
      );
    })}
  </>
);

export const Episode3: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Main />
      <Subtitles />
      <Sequence from={E3_TOTAL - E3_LOOP_FADE} durationInFrames={E3_LOOP_FADE}>
        <AbsoluteFill style={{ opacity: interpolate(frame, [E3_TOTAL - E3_LOOP_FADE, E3_TOTAL - 2], [0, 1], clamp) }}>
          <Main />
          <Caption text={E3_SUBS[0][1]} top={1360} size={58} stagger={3} delay={-14} />
        </AbsoluteFill>
      </Sequence>
      <Audio src={staticFile("audio/episode3_full.wav")} />
    </AbsoluteFill>
  );
};

export const Episode3Composition: React.FC = () => (
  <Composition id="Episode3" component={Episode3} durationInFrames={E3_TOTAL} fps={FPS} width={1080} height={1920} />
);
