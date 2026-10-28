import { Audio } from "@remotion/media";
import { loadFont } from "@remotion/fonts";
import React from "react";
import { AbsoluteFill, Composition, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { Caption, Phone, Screen, Tap } from "../components";
import { C, FPS, inter } from "../theme";
import { Logo } from "../flownova/Brand";
import { phoneAt, usePop } from "../flownova/Video";
import { PHONE_SAFE } from "../flownova/safe";

// "Episode6": 16 s premium showcase of the Flownova demos page (vitrine/, six sector demo shops).
// French ElevenLabs voice-over ("Raphael"), public/audio/voice/episode6.mp3 (14.6 s); frames below come
// from its Scribe word timestamps (×30). audio/make_audio_episode6.py mirrors them.
// Look: near-black green, gold serif titles (Cormorant Garamond, as in the shops' Luxe theme), phones in
// 3D, light sweeps and film grain.
const serif = "Cormorant";
loadFont({ family: serif, url: staticFile("fonts/Cormorant-600.woff2"), weight: "600" });
loadFont({ family: serif, url: staticFile("fonts/Cormorant-500-italic.woff2"), weight: "500", style: "italic" });

export const T6 = { roll: 36, six: 156, test: 214, order: 262, cod: 285, success: 305, choose: 319, same: 352, cta: 410 };
export const E6_TOTAL = 480;
const LOOP_FADE = 15;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const GOLD = "linear-gradient(180deg,#fff3c4 0%,#f3d27a 45%,#c9a14a 100%)";

// Sector cuts, on the spoken words.
const SECTORS = [
  { at: 36, label: "Bijoux", shop: "Maison Saphir", img: "demo-saphir.webp", color: "#1e40af" },
  { at: 58, label: "Mode", shop: "Yasmine Couture", img: "demo-mode.webp", color: "#9f1239" },
  { at: 74, label: "Beauté", shop: "Nour Cosmetics", img: "demo-beaute.webp", color: "#b45372" },
  { at: 94, label: "Déco", shop: "Dar Zina", img: "demo-deco.webp", color: "#1d4e89" },
  { at: 110, label: "Terroir", shop: "Zitouna Terroir", img: "demo-terroir.webp", color: "#4d7c0f" },
  { at: 132, label: "Cadeaux", shop: "Lina Gifts", img: "demo-coffrets.webp", color: "#be185d" },
];

const SUBS: [number, string][] = [
  [0, "Épisode 6."],
  [T6.six, "J'ai créé *6_vraies_boutiques* en ligne."],
  [T6.test, "Tu peux les tester *comme_une_cliente* :"],
  [259, "tu commandes, tu paies *à_la_livraison.*"],
  [T6.choose, "Choisis *ton_secteur…*"],
  [T6.same, "et je te fais la même, avec *tes_produits.*"],
  [T6.cta, "Le lien est *en_bio_!*"],
];

const Gold: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <span style={{ background: GOLD, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", ...style }}>{children}</span>
);

/** Near-black backdrop with a coloured glow, gold hairline frame, vignette and moving grain. */
const Stage: React.FC<{ glow: string }> = ({ glow }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#050b0a", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(900px 1100px at 50% 45%, ${glow}55, transparent 70%)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(700px 500px at 50% 105%, rgba(201,161,74,0.18), transparent 70%)" }} />
      <div style={{ position: "absolute", inset: 40, border: "1.5px solid rgba(243,210,122,0.22)", borderRadius: 28 }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.6) 100%)" }} />
      <AbsoluteFill
        style={{
          opacity: 0.07,
          backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='240' height='240' filter='url(%23n)'/></svg>\")",
          backgroundPosition: `${(frame * 37) % 240}px ${(frame * 53) % 240}px`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Diagonal light sweep across a phone screen. */
const Sweep: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame - at, [0, 24], [-120, 160], clamp);
  return <AbsoluteFill style={{ background: `linear-gradient(105deg, transparent ${x - 20}%, rgba(255,255,255,0.32) ${x}%, transparent ${x + 20}%)`, pointerEvents: "none" }} />;
};

const Badge: React.FC = () => (
  <div style={{ position: "absolute", top: PHONE_SAFE.top + 6, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
    <div style={{ padding: "8px 26px", borderRadius: 999, border: "2px solid #f3d27a", color: "#f3d27a", fontFamily: inter, fontWeight: 800, fontSize: 30, letterSpacing: 6, background: "rgba(0,0,0,0.35)" }}>ÉPISODE 6</div>
  </div>
);

/** Phone shifted horizontally (Phone is centred by default) with a 3D tilt. */
const tilt = (cy: number, scale: number, dx: number, rotY: number, rotZ = 0): React.CSSProperties => ({
  ...phoneAt(cy, scale),
  translate: `${dx}px 0px`,
  transform: `perspective(2400px) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`,
});

// ── 0–36: hook, complete at frame 0 ─────────────────────────────────────────────────────────────
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const sway = Math.sin(frame / 12) * 2;
  return (
    <AbsoluteFill>
      <Stage glow="#0f766e" />
      <Phone style={{ ...tilt(1040, 0.4, -260, 22 + sway, -6), opacity: 0.85 }}><Screen src="demo-mode.webp" y={frame * 4} /></Phone>
      <Phone style={{ ...tilt(1040, 0.4, 260, -22 - sway, 6), opacity: 0.85 }}><Screen src="demo-beaute.webp" y={frame * 4} /></Phone>
      <Phone style={tilt(1000, 0.48, 0, sway)}><Screen src="demo-saphir.webp" y={frame * 5} /><Sweep at={4} /></Phone>
      <Badge />
      <div style={{ position: "absolute", top: PHONE_SAFE.top + 80, left: PHONE_SAFE.left, width: PHONE_SAFE.width, textAlign: "center", fontFamily: serif, fontWeight: 600, fontSize: 96, lineHeight: 1, color: C.white }}>
        6 boutiques.
        <div style={{ fontStyle: "italic", fontWeight: 500, fontSize: 78, marginTop: 8 }}>Laquelle est <Gold>la tienne</Gold> ?</div>
      </div>
    </AbsoluteFill>
  );
};

// ── 36–156: one sector per spoken word ─────────────────────────────────────────────────────────
const SectorShot: React.FC<{ i: number }> = ({ i }) => {
  const frame = useCurrentFrame();
  const s = SECTORS[i];
  const end = i + 1 < SECTORS.length ? SECTORS[i + 1].at : T6.six;
  const t = frame - s.at;
  const p = spring({ frame: t, fps: FPS, config: { damping: 16, stiffness: 160 } });
  const push = interpolate(frame, [s.at, end], [1, 1.06]);
  const dir = i % 2 === 0 ? 1 : -1;
  return (
    <AbsoluteFill>
      <Stage glow={s.color} />
      <AbsoluteFill style={{ scale: String(push) }}>
        <div style={{ position: "absolute", top: 820, left: 0, right: 0, textAlign: "center", fontFamily: serif, fontStyle: "italic", fontWeight: 500, fontSize: 300, lineHeight: 1, opacity: 0.22 * p, color: "#f3d27a", translate: `${(1 - p) * 120 * dir}px 0px` }}>{s.label}</div>
        <Phone style={tilt(980, interpolate(p, [0, 1], [0.44, 0.52]), (1 - p) * 300 * dir, interpolate(p, [0, 1], [-30 * dir, -8 * dir]))}>
          <Screen src={s.img} y={interpolate(t, [0, end - s.at], [180, 900])} />
          <Sweep at={s.at + 2} />
        </Phone>
        <div style={{ position: "absolute", top: PHONE_SAFE.top + 70, left: PHONE_SAFE.left, width: PHONE_SAFE.width, textAlign: "center", opacity: p }}>
          <div style={{ fontFamily: inter, fontWeight: 700, fontSize: 30, letterSpacing: 8, color: "rgba(255,255,255,0.7)" }}>0{i + 1} / 06</div>
          <div style={{ fontFamily: serif, fontWeight: 600, fontSize: 130, lineHeight: 1.05 }}><Gold>{s.label}</Gold></div>
        </div>
        <div style={{ position: "absolute", top: 1390, left: 0, right: 0, textAlign: "center", fontFamily: serif, fontStyle: "italic", fontWeight: 500, fontSize: 52, color: "rgba(255,255,255,0.85)", opacity: p }}>{s.shop}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── 156–214: the six shops together ────────────────────────────────────────────────────────────
const Grid: React.FC = () => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [T6.six, T6.six + 20], [1.5, 1], { ...clamp, easing: (x) => 1 - (1 - x) ** 3 });
  return (
    <AbsoluteFill>
      <Stage glow="#0f766e" />
      <AbsoluteFill style={{ scale: String(zoom) }}>
        {SECTORS.map((s, i) => {
          const p = spring({ frame: frame - T6.six - i * 3, fps: FPS, config: { damping: 15, stiffness: 170 } });
          const col = i % 3;
          const row = Math.floor(i / 3);
          return (
            <Phone key={s.img} style={{ ...tilt(760 + row * 430, 0.28 * p, (col - 1) * 245, (1 - col) * 10), opacity: p }}>
              <Screen src={s.img} y={(frame - T6.six) * 6 + i * 120} />
            </Phone>
          );
        })}
      </AbsoluteFill>
      <div style={{ position: "absolute", top: PHONE_SAFE.top + 60, left: PHONE_SAFE.left, width: PHONE_SAFE.width, textAlign: "center", fontFamily: serif, fontWeight: 600, fontSize: 92, lineHeight: 1, color: C.white, opacity: interpolate(frame, [T6.six + 6, T6.six + 16], [0, 1], clamp) }}>
        <Gold>6 vraies</Gold> boutiques
        <div style={{ fontFamily: inter, fontWeight: 700, fontSize: 32, letterSpacing: 6, marginTop: 14, color: "rgba(255,255,255,0.7)" }}>EN LIGNE · À TESTER</div>
      </div>
    </AbsoluteFill>
  );
};

// ── 214–319: test it like a customer (product → checkout, pay on delivery → order) ──────────────
const Pill: React.FC<{ at: number; top: number; children: React.ReactNode }> = ({ at, top, children }) => {
  const p = usePop(at, 220);
  return (
    <div style={{ position: "absolute", top, left: PHONE_SAFE.left, width: PHONE_SAFE.width, display: "flex", justifyContent: "center", scale: String(p) }}>
      <div style={{ padding: "12px 30px", borderRadius: 999, background: "linear-gradient(180deg,#f3d27a,#c9a14a)", color: "#1c1917", fontFamily: inter, fontWeight: 900, fontSize: 38, boxShadow: "0 14px 34px rgba(0,0,0,0.45)" }}>{children}</div>
    </div>
  );
};

const Customer: React.FC = () => {
  const frame = useCurrentFrame();
  const productY = interpolate(frame, [T6.test, T6.test + 26], [0, 650], { ...clamp, easing: (x) => 1 - (1 - x) ** 3 });
  const checkoutY = interpolate(frame, [T6.order + 4, T6.cod - 6], [600, 1300], clamp);
  const notif = spring({ frame: frame - T6.success - 6, fps: FPS, config: { damping: 14, stiffness: 160 } });
  const enter = spring({ frame: frame - T6.test, fps: FPS, config: { damping: 16, stiffness: 150 } });
  return (
    <AbsoluteFill>
      <Stage glow="#1e40af" />
      <div style={{ position: "absolute", top: PHONE_SAFE.top + 60, left: PHONE_SAFE.left, width: PHONE_SAFE.width, textAlign: "center", fontFamily: serif, fontStyle: "italic", fontWeight: 500, fontSize: 84, lineHeight: 1.05, color: C.white }}>
        Teste-la <Gold>comme une cliente</Gold>
      </div>
      <Phone style={tilt(930, 0.52, 0, interpolate(enter, [0, 1], [-25, 0]))}>
        {frame < T6.order + 4 ? (
          <>
            <Screen src="e5-product-full.png" y={productY} />
            <Tap x={270} y={620} at={T6.order} />
          </>
        ) : frame < T6.success ? (
          <>
            <Screen src="e5-checkout-full.png" y={checkoutY} />
            <Tap x={40} y={76} at={T6.cod} />
          </>
        ) : (
          <>
            <Screen src="e5-success.png" />
            <div style={{ position: "absolute", left: 20, right: 20, top: 40, display: "flex", gap: 18, alignItems: "center", padding: "20px 22px", borderRadius: 30, background: "rgba(255,255,255,0.96)", boxShadow: "0 20px 40px rgba(0,0,0,0.25)", fontFamily: inter, color: "#111", translate: `0px ${(1 - notif) * -200}px` }}>
              <Img src={staticFile("shots/app-icon.png")} style={{ width: 80, height: 80, borderRadius: 18 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 26, color: "#666", fontWeight: 700 }}>MAISON SAPHIR · maintenant</div>
                <div style={{ fontSize: 34, fontWeight: 900 }}>🛍️ Nouvelle commande</div>
                <div style={{ fontSize: 30, fontWeight: 700, color: "#333" }}>890 DT · à la livraison</div>
              </div>
            </div>
          </>
        )}
        <Sweep at={T6.test + 4} />
      </Phone>
      <Pill at={T6.order} top={1270}>✓ Je commande</Pill>
    </AbsoluteFill>
  );
};

// ── 319–410: choose your sector on the demos page → "I want the same" on WhatsApp ──────────────
const Choose: React.FC = () => {
  const frame = useCurrentFrame();
  const ease = (x: number) => x * x * (3 - 2 * x);
  const y = frame < 340 ? interpolate(frame, [T6.choose, T6.choose + 14], [0, 690], { ...clamp, easing: ease }) : interpolate(frame, [342, T6.same - 4], [690, 1150], { ...clamp, easing: ease });
  const bubble = spring({ frame: frame - T6.same - 8, fps: FPS, config: { damping: 13, stiffness: 180 } });
  const enter = spring({ frame: frame - T6.choose, fps: FPS, config: { damping: 16, stiffness: 150 } });
  return (
    <AbsoluteFill>
      <Stage glow="#9f1239" />
      <div style={{ position: "absolute", top: PHONE_SAFE.top + 60, left: PHONE_SAFE.left, width: PHONE_SAFE.width, textAlign: "center", fontFamily: serif, fontWeight: 600, fontSize: 88, lineHeight: 1.02, color: C.white }}>
        {frame < T6.same ? <>Choisis <Gold>ton secteur</Gold></> : <>La même, avec <Gold>tes produits</Gold></>}
      </div>
      <Phone style={tilt(930, 0.52, interpolate(bubble, [0, 1], [0, -90]), interpolate(enter, [0, 1], [25, 0]) + bubble * 10)}>
        <Screen src="demos-page.png" y={y} />
        <Tap x={163} y={153} at={336} />
        <Tap x={195} y={530} at={T6.same - 2} />
        <Sweep at={T6.choose + 4} />
      </Phone>
      {frame >= T6.same ? (
        <div style={{ position: "absolute", top: 1000, right: PHONE_SAFE.right + 10, width: 560, padding: "22px 26px", borderRadius: "30px 30px 6px 30px", background: "#dcf8c6", color: "#111", fontFamily: inter, fontSize: 32, fontWeight: 600, lineHeight: 1.3, boxShadow: "0 24px 50px rgba(0,0,0,0.45)", scale: String(bubble), transformOrigin: "100% 100%" }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#128c7e", marginBottom: 6 }}>WhatsApp · Flownova</div>
          J'ai vu la démo « Bijoux » : je veux la même avec mes produits 😍
          <div style={{ textAlign: "right", fontSize: 22, color: "#555", marginTop: 6 }}>21:04 ✓✓</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ── 410–480: call to action ─────────────────────────────────────────────────────────────────────
const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const logo = usePop(T6.cta, 150);
  const card = usePop(T6.cta + 8, 170);
  const arrow = Math.sin((frame - T6.cta) / 4) * 10;
  return (
    <AbsoluteFill>
      <Stage glow="#0f766e" />
      <div style={{ position: "absolute", top: PHONE_SAFE.top + 40, left: 0, right: 0, textAlign: "center", fontSize: 70, translate: `0px ${-arrow}px` }}>☝️</div>
      <div style={{ position: "absolute", top: 420, left: 0, right: 0, display: "flex", justifyContent: "center", scale: String(logo) }}><Logo size={92} /></div>
      <div style={{ position: "absolute", top: 600, left: PHONE_SAFE.left, width: PHONE_SAFE.width, textAlign: "center", fontFamily: serif, fontWeight: 600, fontSize: 104, lineHeight: 1, color: C.white }}>
        Lien <Gold>en bio</Gold>
      </div>
      <div style={{ position: "absolute", top: 760, left: PHONE_SAFE.left + 30, width: PHONE_SAFE.width - 60, padding: "26px 20px", borderRadius: 30, border: "2px solid rgba(243,210,122,0.6)", background: "rgba(0,0,0,0.45)", textAlign: "center", scale: String(card) }}>
        <div style={{ fontFamily: inter, fontWeight: 700, fontSize: 28, letterSpacing: 5, color: "rgba(255,255,255,0.65)" }}>TESTE LES 6 DÉMOS</div>
        <div style={{ fontFamily: inter, fontWeight: 900, fontSize: 46, color: "#f3d27a", marginTop: 8 }}>flownova-demos.onrender.com</div>
      </div>
      <div style={{ position: "absolute", top: 1010, left: PHONE_SAFE.left, width: PHONE_SAFE.width, textAlign: "center", fontFamily: inter, fontWeight: 800, fontSize: 40, color: C.muted, opacity: interpolate(frame, [T6.cta + 18, T6.cta + 28], [0, 1], clamp) }}>
        ou commente ton secteur 👇
      </div>
      <div style={{ position: "absolute", top: 1100, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", padding: "0 120px", opacity: interpolate(frame, [T6.cta + 24, T6.cta + 34], [0, 1], clamp) }}>
        {SECTORS.map((s) => (
          <span key={s.label} style={{ padding: "8px 20px", borderRadius: 999, border: "1.5px solid rgba(243,210,122,0.45)", color: "#f3d27a", fontFamily: serif, fontStyle: "italic", fontWeight: 500, fontSize: 38 }}>{s.label}</span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const Main: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < T6.roll) return <Hook />;
  if (frame < T6.six) {
    const i = SECTORS.filter((s) => frame >= s.at).length - 1;
    return <SectorShot i={i} />;
  }
  if (frame < T6.test) return <Grid />;
  if (frame < T6.choose) return <Customer />;
  if (frame < T6.cta) return <Choose />;
  return <Cta />;
};

// Short white flash on each hard cut.
const CUTS = [T6.roll, ...SECTORS.slice(1).map((s) => s.at), T6.six, T6.test, T6.choose, T6.cta];
const Flash: React.FC = () => {
  const frame = useCurrentFrame();
  const o = Math.max(0, ...CUTS.map((c) => (frame < c ? 0 : interpolate(frame - c, [0, 1, 6], [0.35, 0.25, 0], clamp))));
  return <AbsoluteFill style={{ background: "#fff8e1", opacity: o, pointerEvents: "none" }} />;
};

export const Episode6: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: "#050b0a" }}>
      <Main />
      <Flash />
      {SUBS.map(([start, text], i) => {
        const end = i + 1 < SUBS.length ? SUBS[i + 1][0] : E6_TOTAL - LOOP_FADE;
        const to = start === 0 ? T6.roll : end;
        return (
          <Sequence key={start} from={start} durationInFrames={to - start} layout="none">
            <Caption text={text} top={1390} size={54} stagger={3} delay={i === 0 ? -14 : 0} />
          </Sequence>
        );
      })}
      <Sequence from={E6_TOTAL - LOOP_FADE} durationInFrames={LOOP_FADE}>
        <AbsoluteFill style={{ opacity: interpolate(frame, [E6_TOTAL - LOOP_FADE, E6_TOTAL - 2], [0, 1], clamp) }}>
          <Hook />
          <Caption text={SUBS[0][1]} top={1390} size={54} stagger={3} delay={-14} />
        </AbsoluteFill>
      </Sequence>
      <Audio src={staticFile("audio/episode6_full.wav")} />
    </AbsoluteFill>
  );
};

export const Episode6Composition: React.FC = () => (
  <Composition id="Episode6" component={Episode6} durationInFrames={E6_TOTAL} fps={FPS} width={1080} height={1920} />
);
