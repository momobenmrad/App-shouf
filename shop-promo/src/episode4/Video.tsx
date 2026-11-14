import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Composition, interpolate, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { Backdrop, Caption, Phone, Screen } from "../components";
import { C, FPS, inter } from "../theme";
import { Logo } from "../flownova/Brand";
import { card, phoneAt, usePop } from "../flownova/Video";
import { PHONE_SAFE } from "../flownova/safe";

// "Episode4": 14 s, French ElevenLabs voice-over (voice "Raphael", as in episodes 1 and 3)
// public/audio/voice/episode4.mp3 (13.2 s), timed on its pauses (ffmpeg silencedetect, 30 fps):
// "How much does an online shop cost in Tunisia? With me: 690 dinars, once. Zero subscription…"
// Shop shown: fictional demo "Maison Saphir" in the Luxe theme (public/shots/luxe-home-full.png).
// audio/make_audio_episode4.py mirrors these frames.
export const T4 = { price: 115, once: 162, nosub: 186, site: 218, cod: 250, wallets: 270, included: 288, cta: 312 };
export const E4_TOTAL = 420;
const LOOP_FADE = 15;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const SUBS: [number, string][] = [
  [0, "Épisode 4."],
  [38, "Combien coûte une *boutique_en_ligne* en Tunisie ?"],
  [97, "Chez moi : *690_dinars…*"],
  [162, "une *seule_fois.* Zéro abonnement."],
  [218, "Site, appli, paiement à la livraison,"],
  [270, "Konnect et Flouci : *tout_est_inclus.*"],
  [312, "Commente *Flownova,* je te montre la démo !"],
];

const Hl: React.FC<{ children: React.ReactNode; bg?: string }> = ({ children, bg = C.yellow }) => (
  <span style={{ background: bg, color: "#1c1917", padding: "0 16px", borderRadius: 18, display: "inline-block", rotate: "-1.5deg" }}>{children}</span>
);

const CHIPS: [string, number][] = [["Site", T4.site], ["Appli", T4.site + 8], ["Paiement à la livraison", T4.cod], ["Konnect", T4.wallets], ["Flouci", T4.wallets + 8]];

const Main: React.FC = () => {
  const frame = useCurrentFrame();
  const priceIn = usePop(T4.price, 170);
  const amount = Math.round(690 * interpolate(frame, [T4.price, T4.price + 24], [0, 1], { ...clamp, easing: (t) => 1 - (1 - t) ** 3 }));
  const once = usePop(T4.once, 220);
  const nosub = usePop(T4.nosub, 220);
  const included = usePop(T4.included, 240);
  const ctaIn = usePop(T4.cta, 160);
  const toPrice = interpolate(frame, [T4.price - 6, T4.price + 6], [0, 1], clamp);
  const toCta = interpolate(frame, [T4.cta - 6, T4.cta + 6], [0, 1], clamp);
  const scroll = interpolate(frame, [0, T4.cta], [0, 4200], clamp);
  const typed = "Flownova".slice(0, Math.max(0, Math.floor((frame - T4.cta - 8) / 3)));
  return (
    <AbsoluteFill>
      <Backdrop />
      <div style={{ position: "absolute", top: PHONE_SAFE.top + 10, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div style={{ padding: "10px 28px", borderRadius: 999, background: C.yellow, color: "#1c1917", fontFamily: inter, fontWeight: 900, fontSize: 38, letterSpacing: 3, boxShadow: "0 10px 30px rgba(0,0,0,0.35)" }}>ÉPISODE 4</div>
      </div>
      {/* Hook: the question, with the shop already scrolling */}
      <div style={{ position: "absolute", top: PHONE_SAFE.top + 90, left: PHONE_SAFE.left, width: PHONE_SAFE.width, textAlign: "center", fontFamily: inter, fontWeight: 900, fontSize: 72, lineHeight: 1.08, letterSpacing: -1.5, color: C.white, opacity: 1 - toPrice }}>
        Combien coûte une <Hl>boutique en ligne</Hl> <span style={{ display: "inline-block", scale: String(1 + Math.max(0, Math.sin(frame * 0.3)) * 0.15) }}>?</span>
      </div>
      <Phone style={{ ...phoneAt(interpolate(toPrice, [0, 1], [930, 925]), interpolate(toPrice, [0, 1], [0.56, 0.37])), opacity: 1 - toCta }}>
        <Screen src="luxe-home-full.png" y={scroll} />
      </Phone>
      {/* Price */}
      {frame >= T4.price - 2 && frame < T4.cta + 6 ? (
        <div style={{ opacity: 1 - toCta }}>
          <div style={{ ...card, left: PHONE_SAFE.left + 40, top: PHONE_SAFE.top + 90, width: PHONE_SAFE.width - 80, padding: "26px 0 30px", textAlign: "center", scale: String(priceIn) }}>
            <div style={{ fontWeight: 800, fontSize: 36, color: "#57534e" }}>Ta boutique + appli</div>
            <div style={{ fontWeight: 900, fontSize: 150, color: "#0f766e", letterSpacing: -5, lineHeight: 1 }}>{amount}<span style={{ fontSize: 64 }}> DT</span></div>
            <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 14 }}>
              <span style={{ padding: "8px 22px", borderRadius: 999, background: C.yellow, fontWeight: 900, fontSize: 34, scale: String(once) }}>une seule fois</span>
              <span style={{ padding: "8px 22px", borderRadius: 999, background: "#dcfce7", color: "#14532d", fontWeight: 900, fontSize: 34, scale: String(nosub) }}>0 abonnement</span>
            </div>
          </div>
          <div style={{ position: "absolute", top: 1215, left: PHONE_SAFE.left, width: PHONE_SAFE.width, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
            {CHIPS.map(([label, at]) => {
              const p = spring({ frame: frame - at, fps: FPS, config: { damping: 12, stiffness: 220 } });
              return (
                <span key={label} style={{ padding: "10px 22px", borderRadius: 999, background: "rgba(255,255,255,0.12)", border: "2px solid rgba(255,255,255,0.25)", color: C.white, fontFamily: inter, fontWeight: 800, fontSize: 34, scale: String(p) }}>✓ {label}</span>
              );
            })}
          </div>
          <div style={{ position: "absolute", top: 820, left: PHONE_SAFE.left + 20, padding: "14px 26px", textAlign: "center", lineHeight: 1.05, borderRadius: 20, border: `6px solid ${C.yellow}`, color: C.yellow, fontFamily: inter, fontWeight: 900, fontSize: 46, rotate: "-8deg", scale: String(interpolate(included, [0, 1], [2.2, 1])), opacity: interpolate(included, [0, 0.3], [0, 1], clamp) }}>
            TOUT<br />INCLUS
          </div>
        </div>
      ) : null}
      {/* Call to action */}
      {frame >= T4.cta - 6 ? (
        <div style={{ opacity: toCta }}>
          <div style={{ position: "absolute", top: PHONE_SAFE.top + 120, left: 0, right: 0, display: "flex", justifyContent: "center", scale: String(ctaIn) }}>
            <Logo size={96} />
          </div>
          <div style={{ position: "absolute", top: 560, left: PHONE_SAFE.left, width: PHONE_SAFE.width, textAlign: "center", fontFamily: inter, fontWeight: 900, fontSize: 64, lineHeight: 1.1, color: C.white }}>
            Commente « <span style={{ color: C.yellow }}>Flownova</span> » 👇
          </div>
          <div style={{ ...card, left: PHONE_SAFE.left + 20, top: 760, width: PHONE_SAFE.width - 40, padding: "22px 26px", display: "flex", alignItems: "center", gap: 20, borderRadius: 999 }}>
            <div style={{ width: 66, height: 66, borderRadius: 99, background: "#fecdd3", flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 44, fontWeight: 800, color: typed ? "#1c1917" : "#a8a29e" }}>{typed || "Ajouter un commentaire…"}</div>
          </div>
          <div style={{ position: "absolute", top: 940, left: PHONE_SAFE.left, width: PHONE_SAFE.width, textAlign: "center", fontFamily: inter, fontWeight: 800, fontSize: 44, color: C.muted, opacity: interpolate(frame, [T4.cta + 40, T4.cta + 50], [0, 1], clamp) }}>
            Je t'envoie la démo de ta boutique
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const Episode4: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Main />
      {SUBS.map(([start, text], i) => {
        const end = i + 1 < SUBS.length ? SUBS[i + 1][0] : E4_TOTAL - LOOP_FADE;
        return (
          <Sequence key={start} from={start} durationInFrames={end - start} layout="none">
            <Caption text={text} top={1380} size={56} stagger={3} delay={i === 0 ? -14 : 0} />
          </Sequence>
        );
      })}
      <Sequence from={E4_TOTAL - LOOP_FADE} durationInFrames={LOOP_FADE}>
        <AbsoluteFill style={{ opacity: interpolate(frame, [E4_TOTAL - LOOP_FADE, E4_TOTAL - 2], [0, 1], clamp) }}>
          <Main />
          <Caption text={SUBS[0][1]} top={1380} size={56} stagger={3} delay={-14} />
        </AbsoluteFill>
      </Sequence>
      <Audio src={staticFile("audio/episode4_full.wav")} />
    </AbsoluteFill>
  );
};

export const Episode4Composition: React.FC = () => (
  <Composition id="Episode4" component={Episode4} durationInFrames={E4_TOTAL} fps={FPS} width={1080} height={1920} />
);
