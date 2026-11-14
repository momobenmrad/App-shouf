import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Composition, interpolate, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { Backdrop, Phone, Screen } from "../components";
import { C, cairo, FPS, inter } from "../theme";
import { Logo } from "./Brand";
import { CtaScene } from "./Episode2";
import { card, phoneAt, SceneIn, usePop } from "./Video";

// "FlownovaSigns": 15 s text-only TikTok (no voice, meant to run under a trending sound):
// "3 signs your Instagram page should become a shop". Music + effects in
// public/audio/flownova_signs.wav (audio/make_audio_flownova_signs.py mirrors these frames).
export const SG = {
  hook: { from: 0, duration: 75 },
  sign1: { from: 75, duration: 75 },
  sign2: { from: 150, duration: 75 },
  sign3: { from: 225, duration: 75 },
  solution: { from: 300, duration: 90 },
  cta: { from: 390, duration: 60 },
} as const;
export const SG_TOTAL = 450;
const LOOP_FADE = 15;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Title: React.FC<{ children: React.ReactNode; top?: number; size?: number; delay?: number }> = ({ children, top = 250, size = 84, delay = 0 }) => {
  const p = usePop(delay, 160);
  return (
    <div
      style={{
        position: "absolute", top, left: 60, right: 60, textAlign: "center", fontFamily: inter, fontWeight: 900, fontSize: size,
        lineHeight: 1.08, letterSpacing: -1.5, color: C.white, textShadow: "0 8px 40px rgba(0,0,0,0.5)",
        opacity: interpolate(p, [0, 0.4], [0, 1], clamp), translate: `0px ${interpolate(p, [0, 1], [40, 0])}px`,
      }}
    >
      {children}
    </div>
  );
};

const Hl: React.FC<{ children: React.ReactNode; bg?: string }> = ({ children, bg = C.yellow }) => (
  <span style={{ background: bg, color: "#1c1917", padding: "0 16px", borderRadius: 18, display: "inline-block", rotate: "-1.5deg" }}>{children}</span>
);

/** "1/3" progress dots, top of the frame: makes viewers wait for the next sign. */
const Progress: React.FC<{ n: number }> = ({ n }) => (
  <div style={{ position: "absolute", top: 140, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 14, alignItems: "center" }}>
    {[1, 2, 3].map((i) => (
      <div key={i} style={{ width: i === n ? 130 : 34, height: 44, borderRadius: 99, background: i <= n ? C.yellow : "rgba(255,255,255,0.25)", display: "grid", placeItems: "center", fontFamily: inter, fontWeight: 900, fontSize: 30, color: "#1c1917" }}>
        {i === n ? `${n}/3` : ""}
      </div>
    ))}
  </div>
);

// ───────────────────────────── Hook (complete at frame 0)
const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ scale: String(1 + frame * 0.0015) }}>
      <div style={{ position: "absolute", top: 330, left: 60, right: 60, textAlign: "center", fontFamily: inter, fontWeight: 900, fontSize: 104, lineHeight: 1.05, letterSpacing: -2, color: C.white }}>
        <Hl>3 signes</Hl> que ta page Instagram doit devenir une <span style={{ color: "#2dd4bf" }}>boutique</span>
      </div>
      <div style={{ position: "absolute", top: 900, left: 0, right: 0, textAlign: "center", fontFamily: inter, fontWeight: 800, fontSize: 52, color: C.muted, scale: String(1 + Math.max(0, Math.sin(frame * 0.25)) * 0.05) }}>
        le n°3 fait mal 😅
      </div>
      <div style={{ position: "absolute", top: 1010, left: 0, right: 0, textAlign: "center", fontSize: 110, translate: `0px ${Math.abs(Math.sin(frame * 0.18)) * 26}px` }}>👇</div>
    </AbsoluteFill>
  );
};

// ───────────────────────────── Sign 1: the same DM fifty times a day
const DMS = ["السوم في البريفي 🙏", "قدّاش السوم؟", "السوم؟؟", "prix stp", "بقدّاش؟", "السوم في البريفي"];
const Sign1: React.FC = () => {
  const frame = useCurrentFrame();
  const count = Math.min(50, Math.round(interpolate(frame, [10, 60], [1, 50], clamp)));
  return (
    <SceneIn>
      <Progress n={1} />
      <Title top={230} size={72}>Tu réponds au <Hl>même message</Hl> 50 fois par jour</Title>
      {DMS.map((m, i) => {
        const p = spring({ frame: frame - 8 - i * 7, fps: FPS, config: { damping: 12, stiffness: 220 } });
        return (
          <div key={i} dir="rtl" lang="ar" style={{ position: "absolute", left: i % 2 ? 470 : 110, top: 640 + i * 105, padding: "18px 30px", borderRadius: 34, background: "#fff", color: "#1c1917", fontFamily: cairo, fontWeight: 800, fontSize: 44, boxShadow: "0 14px 40px rgba(0,0,0,0.4)", scale: String(p), rotate: `${(i % 2 ? 1 : -1) * 2.5}deg` }}>
            {m}
          </div>
        );
      })}
      <div style={{ position: "absolute", right: 70, top: 540, padding: "10px 26px", borderRadius: 999, background: "#ef4444", color: "#fff", fontFamily: inter, fontWeight: 900, fontSize: 64, boxShadow: "0 12px 40px rgba(239,68,68,0.5)" }}>×{count}</div>
    </SceneIn>
  );
};

// ───────────────────────────── Sign 2: orders in a notebook
const NOTES = ["Sarra — robe M — Sfax", "Leila — 2 t-shirts — ???", "Mariem — ??? — Sousse", "Ines — numéro perdu…"];
const Sign2: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <SceneIn>
      <Progress n={2} />
      <Title top={230} size={72}>Tes commandes sont dans un <Hl>cahier</Hl> 📒</Title>
      <div style={{ ...card, left: 120, top: 620, width: 840, height: 560, rotate: "-3deg", background: "repeating-linear-gradient(#fffdf5 0 96px, #bfdbfe 96px 98px)" }}>
        <div style={{ position: "absolute", top: 0, bottom: 0, left: 90, width: 4, background: "#fca5a5" }} />
        {NOTES.map((t, i) => {
          const at = 6 + i * 13;
          const w = interpolate(frame, [at, at + 11], [0, 100], clamp);
          const struck = i % 2 === 1;
          return (
            <div key={t} style={{ position: "absolute", left: 120, top: 40 + i * 120, fontFamily: inter, fontWeight: 600, fontStyle: "italic", fontSize: 48, color: "#1e3a8a", clipPath: `inset(0 ${100 - w}% 0 0)`, rotate: `${(i % 2 ? 1 : -1) * 1.2}deg` }}>
              {t}
              {struck ? (
                <div style={{ position: "absolute", left: -8, right: -8, top: "54%", height: 6, borderRadius: 3, background: "#dc2626", scale: `${interpolate(frame, [at + 20, at + 28], [0, 1], clamp)} 1`, transformOrigin: "left" }} />
              ) : null}
            </div>
          );
        })}
      </div>
    </SceneIn>
  );
};

// ───────────────────────────── Sign 3: no idea how much was sold
const Sign3: React.FC = () => {
  const frame = useCurrentFrame();
  const p = usePop(10, 150);
  const shake = frame > 30 && frame < 50 ? Math.sin(frame * 1.6) * 3 : 0;
  return (
    <SceneIn>
      <Progress n={3} />
      <Title top={230} size={72}>Tu ne sais pas <Hl bg="#fca5a5">combien tu as vendu</Hl> ce mois</Title>
      <div style={{ ...card, left: 140, top: 700, width: 800, padding: "56px 0", textAlign: "center", scale: String(p), rotate: `${shake}deg` }}>
        <div style={{ fontWeight: 800, fontSize: 44, color: "#57534e" }}>Ventes du mois</div>
        <div style={{ fontWeight: 900, fontSize: 180, color: "#dc2626", letterSpacing: -4 }}>??? DT</div>
      </div>
      <div style={{ position: "absolute", top: 1150, left: 0, right: 0, textAlign: "center", fontSize: 120, scale: String(usePop(36, 220)) }}>😅</div>
    </SceneIn>
  );
};

// ───────────────────────────── Solution
const PERKS = ["Commandes en un seul endroit", "Paiement à la livraison · Konnect · Flouci", "Tes ventes en temps réel"];
const Solution: React.FC = () => {
  const frame = useCurrentFrame();
  const ph = usePop(6, 120);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "#fff", opacity: interpolate(frame, [0, 8], [0.85, 0], clamp) }} />
      <div style={{ position: "absolute", top: 150, left: 0, right: 0, display: "flex", justifyContent: "center", scale: String(usePop(2, 160)) }}>
        <Logo size={74} />
      </div>
      <Title top={290} size={70} delay={4}>La solution : <Hl>ta boutique + appli</Hl></Title>
      <Phone style={{ ...phoneAt(930, 0.46), translate: `-200px ${interpolate(ph, [0, 1], [700, 0])}px` }}>
        <Screen src="home-top.png" />
      </Phone>
      <div style={{ position: "absolute", left: 560, top: 640, width: 470, display: "grid", gap: 22 }}>
        {PERKS.map((t, i) => {
          const p = spring({ frame: frame - 18 - i * 10, fps: FPS, config: { damping: 12, stiffness: 200 } });
          return (
            <div key={t} style={{ display: "flex", gap: 16, alignItems: "center", padding: "18px 22px", borderRadius: 24, background: "rgba(255,255,255,0.1)", border: "2px solid rgba(255,255,255,0.2)", color: C.white, fontFamily: inter, fontWeight: 800, fontSize: 32, lineHeight: 1.2, scale: String(p) }}>
              <span style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 99, background: C.brand, color: "#04211d", display: "grid", placeItems: "center", fontWeight: 900 }}>✓</span>
              {t}
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 1250, left: 0, right: 0, display: "flex", justifyContent: "center", scale: String(usePop(56, 220)) }}>
        <div style={{ padding: "16px 40px", borderRadius: 999, background: C.yellow, color: "#1c1917", fontFamily: inter, fontWeight: 900, fontSize: 52 }}>Dès 690 DT · sans abonnement</div>
      </div>
    </AbsoluteFill>
  );
};

export const FlownovaSigns: React.FC = () => {
  const frame = useCurrentFrame();
  const scenes: [keyof typeof SG, React.FC][] = [
    ["hook", HookScene], ["sign1", Sign1], ["sign2", Sign2], ["sign3", Sign3], ["solution", Solution],
    ["cta", () => <CtaScene t={{ box: 4, send: 40, teaser: false, talk: () => false }} />],
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Backdrop />
      {scenes.map(([key, Scene]) => (
        <Sequence key={key} from={SG[key].from} durationInFrames={SG[key].duration} premountFor={30}>
          <Scene />
        </Sequence>
      ))}
      <Sequence from={SG.cta.from} durationInFrames={SG.cta.duration - LOOP_FADE}>
        <div style={{ position: "absolute", top: 1180, left: 0, right: 0, textAlign: "center", fontFamily: inter, fontWeight: 900, fontSize: 58, color: C.white }}>
          Commente « <span style={{ color: C.yellow }}>Flownova</span> » 👇
        </div>
      </Sequence>
      <Sequence from={SG_TOTAL - LOOP_FADE} durationInFrames={LOOP_FADE}>
        <AbsoluteFill style={{ opacity: interpolate(frame, [SG_TOTAL - LOOP_FADE, SG_TOTAL - 2], [0, 1], clamp) }}>
          <Backdrop />
          <HookScene />
        </AbsoluteFill>
      </Sequence>
      <Audio src={staticFile("audio/flownova_signs.wav")} />
    </AbsoluteFill>
  );
};

export const FlownovaSignsComposition: React.FC = () => (
  <Composition id="FlownovaSigns" component={FlownovaSigns} durationInFrames={SG_TOTAL} fps={FPS} width={1080} height={1920} />
);
