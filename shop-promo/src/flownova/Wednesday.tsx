import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Composition, interpolate, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { Backdrop, Phone, PHONE_SAFE, Screen } from "./safe";
import { C, FPS, inter } from "../theme";
import { Logo } from "./Brand";
import { card, phoneAt, SceneIn, usePop } from "./Video";

// Two 15 s text-only TikToks (no voice, room for a trending sound), laid out inside the TikTok
// safe zone (see safe.tsx): "FlownovaStyles" (same shop, Classic vs Luxe theme) and
// "FlownovaVsShopify" (honest comparison + last day of the 590 DT offer).
// Shots: public/shots/cmp-{classic,luxe}-{home,product}.png (demo shop "Maison Saphir", fictional).
// Music + effects: audio/make_audio_flownova_wed.py.
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const TOTAL = 450;
const LOOP_FADE = 15;

const Hl: React.FC<{ children: React.ReactNode; bg?: string }> = ({ children, bg = C.yellow }) => (
  <span style={{ background: bg, color: "#1c1917", padding: "0 16px", borderRadius: 18, display: "inline-block", rotate: "-1.5deg" }}>{children}</span>
);

const Title: React.FC<{ children: React.ReactNode; top?: number; size?: number; delay?: number }> = ({ children, top = PHONE_SAFE.top, size = 76, delay = 0 }) => {
  const p = usePop(delay, 160);
  return (
    <div style={{ position: "absolute", top, left: PHONE_SAFE.left, right: PHONE_SAFE.right, textAlign: "center", fontFamily: inter, fontWeight: 900, fontSize: size, lineHeight: 1.08, letterSpacing: -1.5, color: C.white, textShadow: "0 8px 40px rgba(0,0,0,0.5)", opacity: interpolate(p, [0, 0.4], [0, 1], clamp), translate: `0px ${interpolate(p, [0, 1], [40, 0])}px` }}>
      {children}
    </div>
  );
};

const Loop: React.FC<{ Hook: React.FC }> = ({ Hook }) => {
  const frame = useCurrentFrame();
  return (
    <Sequence from={TOTAL - LOOP_FADE} durationInFrames={LOOP_FADE}>
      <AbsoluteFill style={{ opacity: interpolate(frame, [TOTAL - LOOP_FADE, TOTAL - 2], [0, 1], clamp) }}>
        <Backdrop />
        <Hook />
      </AbsoluteFill>
    </Sequence>
  );
};

// ═════════════════════════════ 1. Same shop, two styles
const Tag: React.FC<{ n: number; label: string; gold?: boolean; style?: React.CSSProperties }> = ({ n, label, gold, style }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "10px 24px", borderRadius: 999, background: gold ? "#b8955a" : "#fff", color: gold ? "#0d1222" : "#1c1917", fontFamily: inter, fontWeight: 900, fontSize: 36, boxShadow: "0 10px 30px rgba(0,0,0,0.35)", ...style }}>
    <span style={{ width: 44, height: 44, borderRadius: 99, background: gold ? "#0d1222" : "#1c1917", color: gold ? "#e9dcc4" : "#fff", display: "grid", placeItems: "center", fontSize: 28 }}>{n}</span>
    {label}
  </div>
);

const StylesHook: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ scale: String(1 + frame * 0.0012) }}>
      <div style={{ position: "absolute", top: PHONE_SAFE.top, left: 60, right: 60, textAlign: "center", fontFamily: inter, fontWeight: 900, fontSize: 96, lineHeight: 1.05, letterSpacing: -2, color: C.white }}>
        Même boutique.<br /><Hl>2 styles.</Hl>
      </div>
      <div style={{ position: "absolute", top: 520, left: 0, right: 0, textAlign: "center", fontFamily: inter, fontWeight: 800, fontSize: 48, color: C.muted }}>Lequel tu choisis ? 👇</div>
      {(["classic", "luxe"] as const).map((t, i) => (
        <Phone key={t} style={{ ...phoneAt(1000, 0.42), translate: `${i ? 190 : -190}px ${Math.sin(frame * 0.1 + i * 2) * 8}px`, rotate: `${i ? 4 : -4}deg` }}>
          <Screen src={`cmp-${t}-home.png`} />
        </Phone>
      ))}
      <div style={{ position: "absolute", top: 1330, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 70 }}>
        <Tag n={1} label="Classique" />
        <Tag n={2} label="Luxe" gold />
      </div>
    </AbsoluteFill>
  );
};

/** Before/after slider: classic on the left, luxe revealed from the right. */
const Compare: React.FC<{ page: "home" | "product"; title: string }> = ({ page, title }) => {
  const frame = useCurrentFrame();
  const pos = interpolate(frame, [12, 50, 80, 110, 135], [100, 0, 0, 50, 50], { ...clamp, easing: (t) => t * t * (3 - 2 * t) });
  return (
    <SceneIn>
      <Title size={70}>{title}</Title>
      <Phone style={phoneAt(900, 0.6)}>
        <Screen src={`cmp-classic-${page}.png`} />
        <AbsoluteFill style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
          <Screen src={`cmp-luxe-${page}.png`} />
        </AbsoluteFill>
        <div style={{ position: "absolute", top: 0, bottom: 0, left: `${pos}%`, width: 8, marginLeft: -4, background: "#b8955a", boxShadow: "0 0 30px rgba(184,149,90,0.9)", opacity: pos > 0 && pos < 100 ? 1 : 0 }} />
      </Phone>
      <div style={{ position: "absolute", top: 1340, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 70 }}>
        <Tag n={1} label="Classique" style={{ opacity: pos > 5 ? 1 : 0.35 }} />
        <Tag n={2} label="Luxe" gold style={{ opacity: pos < 95 ? 1 : 0.35 }} />
      </div>
    </SceneIn>
  );
};

const StylesCta: React.FC = () => (
  <SceneIn>
    <div style={{ position: "absolute", top: PHONE_SAFE.top, left: 0, right: 0, display: "flex", justifyContent: "center", scale: String(usePop(2, 160)) }}>
      <Logo size={84} />
    </div>
    <Title top={470} size={110} delay={6}>
      <Hl>1</Hl> ou <Hl bg="#b8955a">2</Hl> ?
    </Title>
    <Title top={650} size={62} delay={14}>Réponds en commentaire 👇</Title>
    <div style={{ position: "absolute", top: 900, left: 0, right: 0, display: "flex", justifyContent: "center", scale: String(usePop(26, 220)) }}>
      <div style={{ padding: "18px 40px", borderRadius: 999, background: "rgba(255,255,255,0.1)", border: "2px solid rgba(255,255,255,0.25)", color: C.white, fontFamily: inter, fontWeight: 800, fontSize: 44 }}>
        Ta boutique, ton style · dès 690 DT
      </div>
    </div>
  </SceneIn>
);

export const FlownovaStyles: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <Backdrop />
    <Sequence from={0} durationInFrames={75}><StylesHook /></Sequence>
    <Sequence from={75} durationInFrames={150} premountFor={30}><Compare page="home" title="La page d'accueil" /></Sequence>
    <Sequence from={225} durationInFrames={150} premountFor={30}><Compare page="product" title="La fiche produit" /></Sequence>
    <Sequence from={375} durationInFrames={75} premountFor={30}><StylesCta /></Sequence>
    <Loop Hook={StylesHook} />
    <Audio src={staticFile("audio/flownova_styles.wav")} />
  </AbsoluteFill>
);

// ═════════════════════════════ 2. Shopify or Flownova?
// Honest comparison: Shopify keeps its real advantage (apps & themes). Prices are indicative:
// Shopify Basic ≈ 39 $/month billed monthly; Flownova 690 DT once + hosting/domain ≈ 150 DT/year.
const ROWS: [string, string, string, "flow" | "shop"][] = [
  ["Abonnement", "~39 $ / mois", "0 DT / mois", "flow"],
  ["1re année", "≈ 1 400 DT", "≈ 850 DT*", "flow"],
  ["Le site t'appartient", "Plateforme", "100 % à toi", "flow"],
  ["Konnect · Flouci", "Via applis", "Intégrés", "flow"],
  ["Applis & thèmes", "Énorme choix", "L'essentiel", "shop"],
];
const ROW_AT = (i: number) => 14 + i * 40;

const VsHook: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ scale: String(1 + frame * 0.0012) }}>
      <div style={{ position: "absolute", top: 330, left: 60, right: 60, textAlign: "center", fontFamily: inter, fontWeight: 900, fontSize: 110, lineHeight: 1.05, letterSpacing: -2, color: C.white }}>
        <span style={{ color: "#95bf47" }}>Shopify</span>
        <div style={{ margin: "26px auto", width: 150, height: 150, borderRadius: 99, background: C.yellow, color: "#1c1917", display: "grid", placeItems: "center", fontSize: 64, scale: String(1 + Math.max(0, Math.sin(frame * 0.3)) * 0.08) }}>VS</div>
        <span style={{ color: "#2dd4bf" }}>Flownova</span>
      </div>
      <div style={{ position: "absolute", top: 1060, left: 0, right: 0, textAlign: "center", fontFamily: inter, fontWeight: 800, fontSize: 54, color: C.white }}>
        Pour vendre <Hl>en Tunisie</Hl>
      </div>
      <div style={{ position: "absolute", top: 1170, left: 0, right: 0, textAlign: "center", fontFamily: inter, fontWeight: 700, fontSize: 40, color: C.muted }}>Comparatif honnête 👇</div>
    </AbsoluteFill>
  );
};

const Table: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <SceneIn>
      <Title size={64}>Shopify ou Flownova ?</Title>
      <div style={{ ...card, left: PHONE_SAFE.left, top: 360, width: PHONE_SAFE.width, padding: "10px 0 8px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr 1fr", padding: "18px 26px", fontWeight: 900, fontSize: 32 }}>
          <span />
          <span style={{ textAlign: "center", color: "#5e8e3e" }}>Shopify</span>
          <span style={{ textAlign: "center", color: "#0f766e" }}>Flownova</span>
        </div>
        {ROWS.map(([label, shop, flow, win], i) => {
          const p = spring({ frame: frame - ROW_AT(i), fps: FPS, config: { damping: 14, stiffness: 180 } });
          const winStyle: React.CSSProperties = { background: "#dcfce7", color: "#14532d", borderRadius: 14 };
          return (
            <div key={label} style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr 1fr", alignItems: "center", gap: 8, padding: "16px 26px", borderTop: "1px solid #eee", opacity: p, translate: `${interpolate(p, [0, 1], [60, 0])}px 0px` }}>
              <span style={{ fontWeight: 800, fontSize: 30, lineHeight: 1.15 }}>{label}</span>
              <span style={{ textAlign: "center", fontWeight: 700, fontSize: 30, padding: "8px 4px", ...(win === "shop" ? winStyle : { color: "#57534e" }) }}>{shop}{win === "shop" ? " ✓" : ""}</span>
              <span style={{ textAlign: "center", fontWeight: 800, fontSize: 30, padding: "8px 4px", ...(win === "flow" ? winStyle : { color: "#57534e" }) }}>{flow}{win === "flow" ? " ✓" : ""}</span>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 1180, left: PHONE_SAFE.left, width: PHONE_SAFE.width, textAlign: "center", fontFamily: inter, fontWeight: 600, fontSize: 24, lineHeight: 1.35, color: C.muted, opacity: interpolate(frame, [ROW_AT(4) + 10, ROW_AT(4) + 25], [0, 1], clamp) }}>
        *690 DT une seule fois + hébergement & domaine (~150 DT/an).<br />Shopify Basic ≈ 39 $/mois : tarif public indicatif.
      </div>
    </SceneIn>
  );
};

const Verdict: React.FC = () => {
  const frame = useCurrentFrame();
  const fire = usePop(40, 220);
  return (
    <SceneIn>
      <Title top={PHONE_SAFE.top + 40} size={72}>Tu vends <Hl>en Tunisie</Hl> ?</Title>
      <div style={{ position: "absolute", top: 560, left: 0, right: 0, display: "flex", justifyContent: "center", scale: String(usePop(14, 160)) }}>
        <Logo size={110} />
      </div>
      <div style={{ ...card, left: PHONE_SAFE.left + 40, top: 860, width: PHONE_SAFE.width - 80, padding: "34px 24px", textAlign: "center", background: "#0d1222", color: "#fff", scale: String(fire), border: "3px solid #b8955a" }}>
        <div style={{ fontWeight: 900, fontSize: 46 }}>🔥 Dernier jour : <span style={{ color: C.yellow }}>590 DT</span></div>
        <div style={{ fontWeight: 700, fontSize: 32, color: "rgba(255,255,255,0.75)", marginTop: 8 }}>au lieu de 690 DT · ce soir 23h59</div>
      </div>
      <div style={{ position: "absolute", top: 1190, left: 0, right: 0, textAlign: "center", fontFamily: inter, fontWeight: 900, fontSize: 54, color: C.white, opacity: interpolate(frame, [56, 66], [0, 1], clamp) }}>
        Commente « <span style={{ color: C.yellow }}>Flownova</span> » 👇
      </div>
    </SceneIn>
  );
};

export const FlownovaVsShopify: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <Backdrop />
    <Sequence from={0} durationInFrames={75}><VsHook /></Sequence>
    <Sequence from={75} durationInFrames={255} premountFor={30}><Table /></Sequence>
    <Sequence from={330} durationInFrames={120} premountFor={30}><Verdict /></Sequence>
    <Loop Hook={VsHook} />
    <Audio src={staticFile("audio/flownova_vs.wav")} />
  </AbsoluteFill>
);

export const WednesdayCompositions: React.FC = () => (
  <>
    <Composition id="FlownovaStyles" component={FlownovaStyles} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
    <Composition id="FlownovaVsShopify" component={FlownovaVsShopify} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
  </>
);
