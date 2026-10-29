import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Composition, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { Backdrop, Caption, Phone, Screen } from "../components";
import { C, FPS, inter } from "../theme";
import { Logo } from "../flownova/Brand";
import { card, phoneAt, usePop } from "../flownova/Video";
import { PHONE_SAFE } from "../flownova/safe";

// "Episode7": 15.5 s, French ElevenLabs voice-over ("Raphael"), public/audio/voice/episode7.mp3 (14.6 s),
// timed on its pauses (ffmpeg silencedetect, 30 fps). The hook is the first spoken sentence (no spoken
// "Épisode 7": the episodes 3 and 4 lost half their viewers in the first second): "Your Insta page gets
// hacked tomorrow… you lose everything. With your own shop, everything is yours. Even if Insta goes down,
// you keep selling." audio/make_audio_episode7.py mirrors these frames.
export const T7 = { lose: 58, followers: 82, photos: 104, clients: 133, shop: 164, owns: 210, site: 236, crm: 249, orders: 277, down: 300, sell: 335, cta: 384 };
export const E7_TOTAL = 465;
const LOOP_FADE = 15;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const RED = "#ef4444";

const SUBS: [number, string][] = [
  [0, "Ta page Insta se fait *pirater* demain…"],
  [T7.lose, "tu perds *tout* :"],
  [T7.followers, "tes abonnées, tes photos, *tes_clientes.*"],
  [T7.shop, "Avec ta *propre_boutique* en ligne,"],
  [T7.owns, "tout *t'appartient :*"],
  [T7.site, "ton site, tes clientes, *tes_commandes.*"],
  [T7.down, "Même si Insta tombe, toi, tu *continues_de_vendre.*"],
  [T7.cta, "Commente *Flownova,* je te montre la démo !"],
];

const Hl: React.FC<{ children: React.ReactNode; bg?: string; fg?: string }> = ({ children, bg = C.yellow, fg = "#1c1917" }) => (
  <span style={{ background: bg, color: fg, padding: "0 14px", borderRadius: 16, display: "inline-block", rotate: "-1.5deg" }}>{children}</span>
);

const TILES = ["#fde68a", "#fbcfe8", "#c7d2fe", "#bbf7d0", "#fecaca", "#ddd6fe", "#fed7aa", "#a5f3fc", "#e9d5ff"];

/** Instagram profile that empties itself once hacked: counters fall to 0, photos disappear. */
const InstaProfile: React.FC = () => {
  const frame = useCurrentFrame();
  const fall = interpolate(frame, [T7.followers, T7.followers + 20], [1, 0], clamp);
  const followers = fall > 0.99 ? "12,4k" : String(Math.round(12400 * fall));
  const posts = Math.round(86 * interpolate(frame, [T7.photos, T7.photos + 20], [1, 0], clamp));
  const shake = frame >= T7.lose && frame < T7.lose + 10 ? Math.sin(frame * 3) * 10 : 0;
  return (
    <AbsoluteFill style={{ background: "#fff", fontFamily: inter, color: "#111", translate: `${shake}px 0px` }}>
      <div style={{ padding: "120px 36px 0", fontSize: 40, fontWeight: 800 }}>boutique.amira ⌄</div>
      <div style={{ padding: "26px 36px 0", display: "flex", alignItems: "center", gap: 40 }}>
        <div style={{ width: 160, height: 160, borderRadius: 99, padding: 6, background: "linear-gradient(45deg,#f59e0b,#ec4899,#8b5cf6)", filter: frame >= T7.lose ? "grayscale(1)" : "none" }}>
          <div style={{ width: "100%", height: "100%", borderRadius: 99, background: "#fecdd3", border: "6px solid #fff" }} />
        </div>
        <div style={{ display: "flex", gap: 30, fontSize: 28, textAlign: "center" }}>
          {[[String(posts), "posts"], [followers, "abonnés"], ["310", "suivis"]].map(([v, l]) => (
            <div key={l}><div style={{ fontWeight: 800, fontSize: 38, color: frame >= T7.followers && l !== "suivis" ? RED : "#111" }}>{v}</div>{l}</div>
          ))}
        </div>
      </div>
      <div style={{ padding: "22px 36px", fontSize: 30, lineHeight: 1.4 }}>
        <div style={{ fontWeight: 800 }}>Amira · Robes & abayas</div>
        <div>Livraison partout 🇹🇳 · Commande en DM 📩</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 4, marginTop: 6 }}>
        {TILES.map((c, i) => {
          const gone = interpolate(frame, [T7.photos + i * 3, T7.photos + i * 3 + 6], [0, 1], clamp);
          return <div key={i} style={{ aspectRatio: "1", background: c, opacity: 1 - gone * 0.85, filter: `grayscale(${gone})` }} />;
        })}
      </div>
    </AbsoluteFill>
  );
};

/** Hacker alert at the top of the Instagram screen, visible from frame 0. */
const Alert: React.FC = () => (
  <div style={{ position: "absolute", left: 18, right: 18, top: 34, display: "flex", gap: 16, alignItems: "center", padding: "18px 20px", borderRadius: 26, background: "rgba(255,255,255,0.97)", boxShadow: "0 18px 40px rgba(0,0,0,0.3)", fontFamily: inter, color: "#111", border: `3px solid ${RED}` }}>
    <div style={{ width: 70, height: 70, borderRadius: 18, background: "linear-gradient(45deg,#f59e0b,#ec4899,#8b5cf6)", display: "grid", placeItems: "center", fontSize: 40 }}>⚠️</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 24, color: "#666", fontWeight: 700 }}>INSTAGRAM · maintenant</div>
      <div style={{ fontSize: 31, fontWeight: 900, color: RED }}>Connexion inconnue</div>
      <div style={{ fontSize: 26, fontWeight: 600 }}>Ton mot de passe a été changé</div>
    </div>
  </div>
);

const ChipRow: React.FC<{ ok: boolean; items: [number, string][] }> = ({ ok, items }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", top: 1255, left: PHONE_SAFE.left, width: PHONE_SAFE.width, display: "flex", justifyContent: "center", gap: 12 }}>
      {items.map(([at, label]) => {
        const p = spring({ frame: frame - at, fps: FPS, config: { damping: 12, stiffness: 230 } });
        return (
          <div key={label} style={{ padding: "10px 22px", borderRadius: 999, background: ok ? "rgba(20,184,166,0.95)" : "rgba(239,68,68,0.95)", color: ok ? "#04211d" : "#fff", fontFamily: inter, fontWeight: 900, fontSize: 34, textDecoration: ok ? "none" : "line-through", boxShadow: "0 12px 30px rgba(0,0,0,0.35)", scale: String(p) }}>
            {ok ? "✓" : "✗"} {label}
          </div>
        );
      })}
    </div>
  );
};

const Headline: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const frame = useCurrentFrame();
  const o = from <= 0 ? interpolate(frame, [to - 4, to + 2], [1, 0], clamp) : interpolate(frame, [from - 4, from + 4, to - 4, to + 2], [0, 1, 1, 0], clamp);
  return o > 0 ? (
    <div style={{ position: "absolute", top: PHONE_SAFE.top + 85, left: PHONE_SAFE.left, width: PHONE_SAFE.width, textAlign: "center", fontFamily: inter, fontWeight: 900, fontSize: 58, lineHeight: 1.1, letterSpacing: -1.5, color: C.white, opacity: o }}>{children}</div>
  ) : null;
};

const Main: React.FC = () => {
  const frame = useCurrentFrame();
  const toShop = interpolate(frame, [T7.shop - 6, T7.shop + 6], [0, 1], clamp);
  const toDown = interpolate(frame, [T7.down - 6, T7.down + 6], [0, 1], clamp);
  const toCta = interpolate(frame, [T7.cta - 6, T7.cta + 6], [0, 1], clamp);
  const stamp = usePop(T7.lose, 260);
  const ctaIn = usePop(T7.cta, 160);
  const notif = spring({ frame: frame - T7.sell, fps: FPS, config: { damping: 14, stiffness: 170 } });
  const typed = "Flownova".slice(0, Math.max(0, Math.floor((frame - T7.cta - 8) / 3)));
  const redGlow = interpolate(frame, [0, T7.shop - 6, T7.shop + 6], [0.35, 0.5, 0], clamp);
  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ background: `radial-gradient(900px 1000px at 50% 45%, rgba(239,68,68,${redGlow}), transparent 70%)` }} />
      <div style={{ position: "absolute", top: PHONE_SAFE.top + 10, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: 1 - toCta }}>
        <div style={{ padding: "10px 28px", borderRadius: 999, background: C.yellow, color: "#1c1917", fontFamily: inter, fontWeight: 900, fontSize: 38, letterSpacing: 3, boxShadow: "0 10px 30px rgba(0,0,0,0.35)" }}>ÉPISODE 7</div>
      </div>
      <div style={{ opacity: 1 - toCta }}>
        <Headline from={-1} to={T7.shop}>Ta page Insta<br /><Hl bg={RED} fg="#fff">piratée</Hl> demain ?</Headline>
        <Headline from={T7.shop} to={T7.down}>Ta boutique <Hl>t'appartient</Hl></Headline>
        <Headline from={T7.down} to={T7.cta}>Insta tombe ?<br /><Hl>Tu vends</Hl> quand même</Headline>

        {/* Act 1: the hacked Instagram account */}
        {frame < T7.shop + 6 ? (
          <Phone style={{ ...phoneAt(880, 0.5), opacity: 1 - toShop, translate: `${toShop * -300}px 0px` }}>
            <InstaProfile />
            <Alert />
            {frame >= T7.lose ? (
              <div style={{ position: "absolute", top: 640, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
                <div style={{ padding: "16px 34px", border: `10px solid ${RED}`, borderRadius: 24, color: RED, fontFamily: inter, fontWeight: 900, fontSize: 84, rotate: "-12deg", background: "rgba(255,255,255,0.85)", scale: String(interpolate(stamp, [0, 1], [2.4, 1])), opacity: interpolate(stamp, [0, 0.3], [0, 1], clamp) }}>PIRATÉ</div>
              </div>
            ) : null}
          </Phone>
        ) : null}
        {frame < T7.shop ? (
          <>
            <ChipRow ok={false} items={[[T7.followers, "Abonnées"], [T7.photos, "Photos"], [T7.clients, "Clientes"]]} />
          </>
        ) : null}

        {/* Act 2: your own shop and its dashboard */}
        {frame >= T7.shop - 6 && frame < T7.down + 6 ? (
          <Phone style={{ ...phoneAt(880, 0.5), opacity: toShop * (1 - toDown), translate: `${(1 - toShop) * 300}px 0px` }}>
            {frame < T7.crm ? (
              <Screen src="demo-mode.webp" y={interpolate(frame, [T7.shop, T7.crm], [0, 1300])} />
            ) : (
              <Screen src="demo-admin.webp" />
            )}
          </Phone>
        ) : null}
        {frame >= T7.shop && frame < T7.down ? (
          <>
            <ChipRow ok items={[[T7.site, "Ton site"], [T7.crm, "Clientes"], [T7.orders, "Commandes"]]} />
          </>
        ) : null}

        {/* Act 3: Instagram is down, the shop still sells */}
        {frame >= T7.down - 6 && frame < T7.cta + 6 ? (
          <div style={{ opacity: toDown }}>
            <div style={{ position: "absolute", top: 560, left: PHONE_SAFE.left + 10, width: 230, textAlign: "center" }}>
              <div style={{ width: 170, height: 170, margin: "0 auto", borderRadius: 46, background: "linear-gradient(45deg,#f59e0b,#ec4899,#8b5cf6)", filter: "grayscale(1)", opacity: 0.55, display: "grid", placeItems: "center", fontSize: 90, color: "#fff" }}>◎</div>
              <div style={{ marginTop: 14, fontFamily: inter, fontWeight: 900, fontSize: 32, color: RED }}>Insta en panne</div>
            </div>
            <Phone style={{ ...phoneAt(900, 0.5), translate: "140px 0px" }}>
              <Screen src="demo-saphir.webp" y={interpolate(frame, [T7.down, T7.cta], [0, 500])} />
              <div style={{ position: "absolute", left: 20, right: 20, top: 40, display: "flex", gap: 18, alignItems: "center", padding: "20px 22px", borderRadius: 30, background: "rgba(255,255,255,0.97)", boxShadow: "0 20px 40px rgba(0,0,0,0.3)", fontFamily: inter, color: "#111", translate: `0px ${(1 - notif) * -260}px` }}>
                <Img src={staticFile("shots/app-icon.png")} style={{ width: 80, height: 80, borderRadius: 18 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 26, color: "#666", fontWeight: 700 }}>TA BOUTIQUE · maintenant</div>
                  <div style={{ fontSize: 34, fontWeight: 900 }}>🛍️ Nouvelle commande</div>
                  <div style={{ fontSize: 30, fontWeight: 700, color: "#333" }}>149 DT · à la livraison</div>
                </div>
              </div>
            </Phone>
          </div>
        ) : null}
      </div>

      {/* Call to action */}
      {frame >= T7.cta - 6 ? (
        <div style={{ opacity: toCta }}>
          <div style={{ position: "absolute", top: PHONE_SAFE.top + 60, left: 0, right: 0, display: "flex", justifyContent: "center", scale: String(ctaIn) }}><Logo size={96} /></div>
          <div style={{ position: "absolute", top: 500, left: PHONE_SAFE.left, width: PHONE_SAFE.width, textAlign: "center", fontFamily: inter, fontWeight: 900, fontSize: 60, lineHeight: 1.1, color: C.white }}>
            Ne mets pas tout ton business <Hl>sur une seule appli</Hl>
          </div>
          <div style={{ position: "absolute", top: 760, left: PHONE_SAFE.left, width: PHONE_SAFE.width, textAlign: "center", fontFamily: inter, fontWeight: 900, fontSize: 56, color: C.white }}>
            Commente « <span style={{ color: C.yellow }}>Flownova</span> » 👇
          </div>
          <div style={{ ...card, left: PHONE_SAFE.left + 20, top: 880, width: PHONE_SAFE.width - 40, padding: "22px 26px", display: "flex", alignItems: "center", gap: 20, borderRadius: 999 }}>
            <div style={{ width: 66, height: 66, borderRadius: 99, background: "#fecdd3", flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 44, fontWeight: 800, color: typed ? "#1c1917" : "#a8a29e" }}>{typed || "Ajouter un commentaire…"}</div>
          </div>
          <div style={{ position: "absolute", top: 1060, left: PHONE_SAFE.left, width: PHONE_SAFE.width, textAlign: "center", fontFamily: inter, fontWeight: 800, fontSize: 40, color: C.muted, opacity: interpolate(frame, [T7.cta + 34, T7.cta + 44], [0, 1], clamp) }}>
            690 DT une seule fois · zéro abonnement
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const Episode7: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Main />
      {SUBS.map(([start, text], i) => {
        const end = i + 1 < SUBS.length ? SUBS[i + 1][0] : E7_TOTAL - LOOP_FADE;
        return (
          <Sequence key={start} from={start} durationInFrames={end - start} layout="none">
            <Caption text={text} top={1400} size={54} stagger={3} delay={i === 0 ? -30 : 0} />
          </Sequence>
        );
      })}
      <Sequence from={E7_TOTAL - LOOP_FADE} durationInFrames={LOOP_FADE}>
        <AbsoluteFill style={{ opacity: interpolate(frame, [E7_TOTAL - LOOP_FADE, E7_TOTAL - 2], [0, 1], clamp) }}>
          <Main />
          <Caption text={SUBS[0][1]} top={1400} size={54} stagger={3} delay={-30} />
        </AbsoluteFill>
      </Sequence>
      <Audio src={staticFile("audio/episode7_full.wav")} />
    </AbsoluteFill>
  );
};

export const Episode7Composition: React.FC = () => (
  <Composition id="Episode7" component={Episode7} durationInFrames={E7_TOTAL} fps={FPS} width={1080} height={1920} />
);
