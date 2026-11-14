import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Composition, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { Backdrop, Caption, Phone, Screen, Tap } from "../components";
import { C, css, FPS, inter } from "../theme";
import { Logo } from "../flownova/Brand";
import { card, phoneAt, usePop } from "../flownova/Video";
import { PHONE_SAFE } from "../flownova/safe";

// "Episode5": 15 s, French ElevenLabs voice-over ("Raphael", as in episodes 1, 3 and 4)
// public/audio/voice/episode5.mp3 (13.7 s), timed on its pauses (ffmpeg silencedetect, 30 fps):
// "'Price?' 'Price in DM?' You answer that 50 times a day? With your shop, the price is shown. Your
// customer orders on her own in three clicks, and pays on delivery. You just get the order."
// Shop shown: fictional demo "Maison Saphir" in the Luxe theme (public/shots/e5-*.png).
// audio/make_audio_episode5.py mirrors these frames.
export const T5 = { prix: 39, inbox: 63, fifty: 93, shop: 155, order: 213, add: 222, checkout: 236, cod: 282, validate: 302, success: 318, cta: 376 };
export const E5_TOTAL = 450;
const LOOP_FADE = 15;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const SUBS: [number, string][] = [
  [0, "Épisode 5."],
  [T5.prix, "*«_Prix_?_»*"],
  [T5.inbox, "*«_Prix_en_inbox_?_»*"],
  [T5.fifty, "Tu réponds ça *50_fois* par jour ?"],
  [T5.shop, "Avec ta boutique, le prix est *affiché.*"],
  [T5.order, "Ta cliente commande *toute_seule,* en trois clics…"],
  [278, "et elle paie *à_la_livraison.*"],
  [T5.success, "Toi, tu reçois *juste_la_commande.*"],
  [T5.cta, "Commente *Flownova* !"],
];

// Instagram DMs piling up; the first one is already there at frame 0.
const DMS: [number, string, string][] = [
  [-4, "dorra.m", "Livraison Sfax ?"],
  [-3, "salma", "Prix stp 🙏"],
  [-2, "lina.b", "C'est combien ?"],
  [-1, "amel.b", "Slm, prix ?"],
  [T5.prix - 4, "nour_shop", "Prix ?"],
  [T5.inbox - 4, "yasmine.t", "Prix en inbox ? 🙏"],
  [T5.fifty, "rania", "Combien ?"],
  [T5.fifty + 10, "sarra.k", "Prix svp"],
  [T5.fifty + 19, "ines", "Bch9adeh ?"],
  [T5.fifty + 27, "mariem", "Dispo ? prix ?"],
  [T5.fifty + 35, "eya", "Prix ??"],
  [T5.fifty + 43, "hela", "???"],
];
const AVATARS = ["#99f6e4", "#fca5a5", "#fdba74", "#fecdd3", "#fde68a", "#c7d2fe", "#bbf7d0", "#fbcfe8", "#ddd6fe", "#fed7aa", "#a5f3fc", "#e9d5ff"];

const DmScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const shown = DMS.filter(([at]) => frame >= at);
  const unread = Math.round(interpolate(frame, [T5.fifty, T5.shop - 10], [4, 50], clamp));
  return (
    <AbsoluteFill style={{ background: "#fff", fontFamily: inter, color: "#111" }}>
      <div style={{ padding: "120px 36px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid #eee" }}>
        <div style={{ fontSize: 44, fontWeight: 800 }}>Messages</div>
        <div style={{ padding: "6px 18px", borderRadius: 99, background: "#ef4444", color: "#fff", fontSize: 34, fontWeight: 900, scale: String(1 + 0.12 * Math.max(0, Math.sin(frame * 0.6)) * (frame > T5.fifty ? 1 : 0)) }}>{unread}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {shown.slice().reverse().slice(0, 8).map(([at, who, msg], i) => {
          const p = spring({ frame: frame - at, fps: FPS, config: { damping: 14, stiffness: 220 } });
          return (
            <div key={who} style={{ display: "flex", alignItems: "center", gap: 22, padding: "20px 36px", opacity: at < 0 ? 1 : p, translate: `0px ${at < 0 ? 0 : (1 - p) * -40}px`, background: i === 0 && at >= 0 ? "#f0f9ff" : "transparent" }}>
              <div style={{ width: 92, height: 92, borderRadius: 99, background: AVATARS[DMS.findIndex((d) => d[1] === who) % AVATARS.length], flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 32, fontWeight: 700 }}>{who}</div>
                <div style={{ fontSize: 34, fontWeight: 800, color: "#111" }}>{msg}</div>
              </div>
              <div style={{ width: 18, height: 18, borderRadius: 9, background: "#3b82f6" }} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** The shop: product page (price shown) → checkout (pay on delivery) → thank-you page + notification. */
const ShopScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const productY = interpolate(frame, [T5.shop, T5.shop + 28], [0, 650], { ...clamp, easing: (t) => 1 - (1 - t) ** 3 });
  const checkoutY = interpolate(frame, [T5.checkout + 6, T5.cod - 6], [0, 1300], { ...clamp, easing: (t) => t * t * (3 - 2 * t) });
  const priceRing = usePop(T5.shop + 30, 220);
  const notif = spring({ frame: frame - T5.success - 12, fps: FPS, config: { damping: 14, stiffness: 160 } });
  return (
    <AbsoluteFill style={{ background: "#f7f3ec" }}>
      {frame < T5.checkout ? (
        <>
          <Screen src="e5-product-full.png" y={productY} />
          <div style={{ position: "absolute", left: css(6), top: css(935 - 650 - 26), width: css(270), height: css(52), borderRadius: 16, border: `6px solid ${C.yellow}`, boxShadow: "0 0 0 6px rgba(250,204,21,0.25)", scale: String(priceRing), opacity: frame < T5.order ? 1 : 0 }} />
          <Tap x={270} y={620} at={T5.add} />
        </>
      ) : frame < T5.success ? (
        <>
          <Screen src="e5-checkout-full.png" y={checkoutY} />
          <Tap x={40} y={1376 - 1300} at={T5.cod} />
          <Tap x={195} y={2078 - 1300} at={T5.validate} />
        </>
      ) : (
        <>
          <Screen src="e5-success.png" />
          <div style={{ position: "absolute", left: 20, right: 20, top: 40, display: "flex", gap: 18, alignItems: "center", padding: "20px 22px", borderRadius: 30, background: "rgba(255,255,255,0.96)", boxShadow: "0 20px 40px rgba(0,0,0,0.25)", fontFamily: inter, color: "#111", translate: `0px ${(1 - notif) * -200}px` }}>
            <Img src={staticFile("shots/app-icon.png")} style={{ width: 80, height: 80, borderRadius: 18 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 26, color: "#666", fontWeight: 700 }}>MA BOUTIQUE · maintenant</div>
              <div style={{ fontSize: 34, fontWeight: 900 }}>🛍️ Nouvelle commande</div>
              <div style={{ fontSize: 30, fontWeight: 700, color: "#333" }}>Sarra · 890 DT · à la livraison</div>
            </div>
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

const Hl: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ background: C.yellow, color: "#1c1917", padding: "0 14px", borderRadius: 16, display: "inline-block", rotate: "-1.5deg" }}>{children}</span>
);

const HEADLINES: [number, number, React.ReactNode][] = [
  [-99, T5.shop, <>« Prix en inbox ? » <span style={{ display: "inline-block" }}>😩</span></>],
  [T5.shop, T5.order, <>Le prix est <Hl>affiché</Hl></>],
  [T5.order, T5.success, <>Elle commande <Hl>seule</Hl></>],
  [T5.success, T5.cta, <>Tu reçois <Hl>la commande</Hl> 🔔</>],
];

const STEPS: [number, string][] = [[T5.add, "Ajouter"], [T5.cod, "Livraison"], [T5.validate, "Valider"]];

const Main: React.FC = () => {
  const frame = useCurrentFrame();
  const toShop = interpolate(frame, [T5.shop - 6, T5.shop + 6], [0, 1], clamp);
  const toCta = interpolate(frame, [T5.cta - 6, T5.cta + 6], [0, 1], clamp);
  const ctaIn = usePop(T5.cta, 160);
  const fifty = usePop(T5.fifty, 200);
  const typed = "Flownova".slice(0, Math.max(0, Math.floor((frame - T5.cta - 8) / 3)));
  return (
    <AbsoluteFill>
      <Backdrop />
      <div style={{ position: "absolute", top: PHONE_SAFE.top + 10, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div style={{ padding: "10px 28px", borderRadius: 999, background: C.yellow, color: "#1c1917", fontFamily: inter, fontWeight: 900, fontSize: 38, letterSpacing: 3, boxShadow: "0 10px 30px rgba(0,0,0,0.35)" }}>ÉPISODE 5</div>
      </div>
      <div style={{ opacity: 1 - toCta }}>
        {HEADLINES.map(([from, to, node]) => {
          const o = interpolate(frame, [from - 4, from + 4, to - 4, to + 2], [0, 1, 1, 0], clamp);
          return o > 0 ? (
            <div key={from} style={{ position: "absolute", top: PHONE_SAFE.top + 85, left: PHONE_SAFE.left, width: PHONE_SAFE.width, textAlign: "center", fontFamily: inter, fontWeight: 900, fontSize: 62, lineHeight: 1.1, letterSpacing: -1.5, whiteSpace: "nowrap", color: C.white, opacity: from < 0 ? (frame >= to - 4 ? o : 1) : o }}>{node}</div>
          ) : null;
        })}
        {frame >= T5.fifty && frame < T5.shop + 4 ? (
          <div style={{ position: "absolute", top: 560, left: PHONE_SAFE.left - 10, padding: "12px 22px", borderRadius: 22, background: "#ef4444", color: "#fff", fontFamily: inter, fontWeight: 900, fontSize: 40, lineHeight: 1.05, textAlign: "center", rotate: "-8deg", scale: String(fifty), opacity: 1 - toShop, boxShadow: "0 14px 30px rgba(0,0,0,0.4)" }}>
            50×<br /><span style={{ fontSize: 28 }}>par jour</span>
          </div>
        ) : null}
        <Phone style={phoneAt(875, 0.58)}>
          <AbsoluteFill style={{ opacity: 1 - toShop }}><DmScreen /></AbsoluteFill>
          {frame >= T5.shop - 6 ? (
            <AbsoluteFill style={{ opacity: toShop, translate: `${(1 - toShop) * 200}px 0px` }}><ShopScreen /></AbsoluteFill>
          ) : null}
        </Phone>
        {frame >= T5.order - 4 ? (
          <div style={{ position: "absolute", top: 1300, left: PHONE_SAFE.left, width: PHONE_SAFE.width, display: "flex", justifyContent: "center", gap: 12, opacity: interpolate(frame, [T5.order - 4, T5.order + 4], [0, 1], clamp) }}>
            {STEPS.map(([at, label], i) => {
              const done = frame >= at;
              const p = spring({ frame: frame - at, fps: FPS, config: { damping: 10, stiffness: 240 } });
              return (
                <span key={label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 20px 8px 10px", borderRadius: 999, background: done ? "rgba(20,184,166,0.95)" : "rgba(255,255,255,0.1)", border: "2px solid rgba(255,255,255,0.25)", color: done ? "#04211d" : C.white, fontFamily: inter, fontWeight: 900, fontSize: 32, scale: String(done ? 1 + 0.15 * Math.max(0, 1 - p) : 1) }}>
                  <span style={{ width: 44, height: 44, borderRadius: 99, display: "grid", placeItems: "center", background: done ? "#04211d" : "rgba(255,255,255,0.2)", color: done ? C.yellow : C.white, fontSize: 28 }}>{done ? "✓" : i + 1}</span>
                  {label}
                </span>
              );
            })}
          </div>
        ) : null}
      </div>
      {frame >= T5.cta - 6 ? (
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
          <div style={{ position: "absolute", top: 940, left: PHONE_SAFE.left, width: PHONE_SAFE.width, textAlign: "center", fontFamily: inter, fontWeight: 800, fontSize: 44, color: C.muted, opacity: interpolate(frame, [T5.cta + 30, T5.cta + 40], [0, 1], clamp) }}>
            Fini les « prix en inbox » 😉
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const Episode5: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Main />
      {SUBS.map(([start, text], i) => {
        const end = i + 1 < SUBS.length ? SUBS[i + 1][0] : E5_TOTAL - LOOP_FADE;
        return (
          <Sequence key={start} from={start} durationInFrames={end - start} layout="none">
            <Caption text={text} top={1380} size={56} stagger={3} delay={i === 0 ? -14 : 0} />
          </Sequence>
        );
      })}
      <Sequence from={E5_TOTAL - LOOP_FADE} durationInFrames={LOOP_FADE}>
        <AbsoluteFill style={{ opacity: interpolate(frame, [E5_TOTAL - LOOP_FADE, E5_TOTAL - 2], [0, 1], clamp) }}>
          <Main />
          <Caption text={SUBS[0][1]} top={1380} size={56} stagger={3} delay={-14} />
        </AbsoluteFill>
      </Sequence>
      <Audio src={staticFile("audio/episode5_full.wav")} />
    </AbsoluteFill>
  );
};

export const Episode5Composition: React.FC = () => (
  <Composition id="Episode5" component={Episode5} durationInFrames={E5_TOTAL} fps={FPS} width={1080} height={1920} />
);
