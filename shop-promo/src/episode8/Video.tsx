import { Audio } from "@remotion/media";
import { loadFont } from "@remotion/fonts";
import React from "react";
import { AbsoluteFill, Composition, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { Phone, Screen, Tap } from "../components";
import { FPS, inter } from "../theme";
import { FlowMark } from "../flownova/Brand";
import { phoneAt, usePop } from "../flownova/Video";
import { PHONE_SAFE } from "../flownova/safe";

// "Episode8": 13.5 s premium video for the mini catalogue page (vitrine/mini/, entry offer).
// French ElevenLabs voice-over ("Raphael"), public/audio/voice/episode8.mp3 (12.3 s), timed on its pauses
// (ffmpeg silencedetect, 30 fps). The hook is the first spoken sentence and the first frame is bright
// (ivory + gold): the dark openings of episodes 3 to 5 lost half their viewers in the first second.
// audio/make_audio_episode8.py mirrors these frames.
const serif = "Cormorant";
loadFont({ family: serif, url: staticFile("fonts/Cormorant-600.woff2"), weight: "600" });
loadFont({ family: serif, url: staticFile("fonts/Cormorant-500-italic.woff2"), weight: "500", style: "italic" });

export const T8 = { page: 36, products: 80, choose: 131, tapProduct: 133, sheet: 140, tapSize: 152, order: 164, tapOrder: 168, chat: 178, fini: 217, strike: 240, ready: 281, cta: 324 };
export const E8_TOTAL = 405;
const LOOP_FADE = 15;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const INK = "#1d1a16";
const GOLD = "#b8924a";
const WA = "#25d366";
const PRICE = "150 DT";

const SUBS: [number, string][] = [
  [0, "Si tu vends sur Insta,"],
  [T8.page, "il te faut *cette_page.*"],
  [T8.products, "Tous tes produits, *avec_les_prix.*"],
  [T8.choose, "Ta cliente choisit…"],
  [T8.order, "et commande *en_un_clic* sur WhatsApp."],
  [T8.fini, "Fini les *«_prix_?_»* en inbox."],
  [T8.ready, "Prête en *24_heures.*"],
  [T8.cta, "Commente *«_page_»,* je t'envoie la démo !"],
];

/** Subtitle on a dark pill (the backdrop is light), highlighted words in gold. */
const Sub: React.FC<{ text: string; delay?: number }> = ({ text, delay = 0 }) => {
  const frame = useCurrentFrame();
  const words = text.split(" ");
  return (
    <div style={{ position: "absolute", top: 1395, left: PHONE_SAFE.left, width: PHONE_SAFE.width, display: "flex", justifyContent: "center" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 14px", padding: "14px 30px", borderRadius: 30, background: "rgba(29,26,22,0.94)", fontFamily: inter, fontWeight: 800, fontSize: 48, lineHeight: 1.15, color: "#fff", boxShadow: "0 18px 40px rgba(60,40,10,0.25)" }}>
        {words.map((w, i) => {
          const hl = w.startsWith("*") && w.endsWith("*");
          const p = spring({ frame: frame - delay - i * 3, fps: FPS, config: { damping: 14, stiffness: 200 } });
          return (
            <span key={i} style={{ display: "inline-block", color: hl ? "#f3d27a" : "#fff", opacity: interpolate(p, [0, 0.3], [0, 1], clamp), translate: `0px ${(1 - p) * 20}px` }}>
              {(hl ? w.slice(1, -1) : w).replace(/_/g, " ")}
            </span>
          );
        })}
      </div>
    </div>
  );
};

/** Ivory backdrop with a drifting gold light, hairline frame and grain. */
const Stage: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#f7f1e8", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(900px 900px at ${30 + Math.sin(frame / 50) * 20}% 30%, rgba(243,210,122,0.55), transparent 70%)` }} />
      <AbsoluteFill style={{ background: `radial-gradient(800px 700px at ${75 - Math.sin(frame / 60) * 15}% 80%, rgba(159,18,57,0.12), transparent 70%)` }} />
      <div style={{ position: "absolute", inset: 40, border: "1.5px solid rgba(184,146,74,0.45)", borderRadius: 28 }} />
      <AbsoluteFill
        style={{
          opacity: 0.05,
          backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='240' height='240' filter='url(%23n)'/></svg>\")",
          backgroundPosition: `${(frame * 37) % 240}px ${(frame * 53) % 240}px`,
        }}
      />
    </AbsoluteFill>
  );
};

const Em: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = GOLD }) => (
  <span style={{ fontStyle: "italic", fontWeight: 500, color }}>{children}</span>
);

const Title: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const frame = useCurrentFrame();
  const o = from <= 0 ? interpolate(frame, [to - 4, to + 2], [1, 0], clamp) : interpolate(frame, [from - 3, from + 5, to - 4, to + 2], [0, 1, 1, 0], clamp);
  const y = from <= 0 ? 0 : interpolate(frame, [from - 3, from + 8], [30, 0], clamp);
  return o > 0 ? (
    <div style={{ position: "absolute", top: PHONE_SAFE.top + 30, left: PHONE_SAFE.left, width: PHONE_SAFE.width, textAlign: "center", fontFamily: serif, fontWeight: 600, fontSize: 96, lineHeight: 1.02, color: INK, opacity: o, translate: `0px ${y}px` }}>{children}</div>
  ) : null;
};

// Product cards floating around the phone during the hook.
const FLOAT: [string, number, number, number, string][] = [
  ["robe-satin-emeraude", 70, 640, -9, "149 DT"],
  ["abaya-noire-brodee", 760, 600, 8, "189 DT"],
  ["tailleur-rose-poudre", 60, 1010, 7, "169 DT"],
  ["sac-cuir-camel", 690, 1040, -7, "159 DT"],
];

const Floating: React.FC = () => {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [T8.choose - 8, T8.choose + 4], [0, 1], clamp);
  return (
    <>
      {FLOAT.map(([img, x, y, rot, price], i) => {
        const bob = Math.sin(frame / 14 + i * 1.7) * 12;
        const tag = spring({ frame: frame - T8.products - 6 - i * 7, fps: FPS, config: { damping: 11, stiffness: 220 } });
        const side = x < 400 ? -1 : 1;
        return (
          <div key={img} style={{ position: "absolute", left: x + side * out * 500, top: y + bob, width: 220, rotate: `${rot + Math.sin(frame / 20 + i) * 2}deg`, opacity: 1 - out }}>
            <div style={{ borderRadius: 26, overflow: "hidden", background: "#fffdf9", border: "1px solid #e6dccd", boxShadow: "0 30px 60px rgba(90,60,20,0.25)" }}>
              <Img src={staticFile(`shots/mini/${img}-a.svg`)} style={{ width: 220, height: 275, display: "block" }} />
            </div>
            <div style={{ position: "absolute", bottom: -22, left: side < 0 ? 20 : undefined, right: side > 0 ? 20 : undefined, padding: "8px 20px", borderRadius: 999, background: "linear-gradient(180deg,#f3d27a,#c9a14a)", color: INK, fontFamily: inter, fontWeight: 900, fontSize: 36, boxShadow: "0 12px 26px rgba(90,60,20,0.35)", scale: String(tag) }}>{price}</div>
          </div>
        );
      })}
    </>
  );
};

/** WhatsApp conversation with the pre-filled order, as the seller receives it. */
const Chat: React.FC = () => {
  const frame = useCurrentFrame();
  const sent = spring({ frame: frame - T8.chat - 4, fps: FPS, config: { damping: 14, stiffness: 200 } });
  const reply = spring({ frame: frame - T8.chat - 24, fps: FPS, config: { damping: 14, stiffness: 200 } });
  return (
    <AbsoluteFill style={{ background: "#efe7dc", fontFamily: inter, color: "#111" }}>
      <div style={{ background: "#075e54", color: "#fff", padding: "110px 30px 24px", display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ width: 84, height: 84, borderRadius: 99, background: "#9f1239", display: "grid", placeItems: "center", fontFamily: serif, fontSize: 50, fontWeight: 600 }}>A</div>
        <div>
          <div style={{ fontSize: 38, fontWeight: 800 }}>Amira Boutique</div>
          <div style={{ fontSize: 26, opacity: 0.85 }}>en ligne</div>
        </div>
      </div>
      <div style={{ padding: "30px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ alignSelf: "flex-end", maxWidth: 570, padding: "24px 28px", borderRadius: "28px 28px 6px 28px", background: "#dcf8c6", fontSize: 38, lineHeight: 1.35, fontWeight: 500, boxShadow: "0 4px 10px rgba(0,0,0,0.12)", scale: String(sent), transformOrigin: "100% 100%" }}>
          Bonjour Amira Boutique 👋<br />Je veux commander :<br /><b>• Robe satin émeraude<br />— Taille L × 1</b><br />Total : <b>149 DT</b> + livraison 7 DT
          <div style={{ textAlign: "right", fontSize: 22, color: "#555", marginTop: 6 }}>21:04 <span style={{ color: "#34b7f1" }}>✓✓</span></div>
        </div>
        <div style={{ alignSelf: "flex-start", maxWidth: 540, padding: "24px 28px", borderRadius: "28px 28px 28px 6px", background: "#fff", fontSize: 38, lineHeight: 1.35, fontWeight: 500, boxShadow: "0 4px 10px rgba(0,0,0,0.12)", scale: String(reply), transformOrigin: "0% 100%" }}>
          Merci 🤍 C'est noté, livraison demain !
        </div>
      </div>
    </AbsoluteFill>
  );
};

const DMS: [string, number, number, number][] = [["Prix ?", 90, 560, -6], ["Prix en inbox ? 🙏", 500, 700, 5], ["C'est combien ?", 110, 900, 4], ["Prix svp", 610, 1050, -5], ["Slm, prix ?", 250, 1160, 3]];

const Fini: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {DMS.map(([msg, x, y, rot], i) => {
        const p = spring({ frame: frame - T8.fini - i * 4, fps: FPS, config: { damping: 12, stiffness: 220 } });
        const cut = interpolate(frame, [T8.strike + i * 3, T8.strike + i * 3 + 6], [0, 1], clamp);
        const drop = interpolate(frame, [T8.strike + 14 + i * 2, T8.ready], [0, 1], clamp);
        return (
          <div key={msg} style={{ position: "absolute", left: x, top: y + drop * drop * 900, rotate: `${rot + drop * 25}deg`, scale: String(p), opacity: 1 - drop * 0.6 }}>
            <div style={{ position: "relative", padding: "18px 30px", borderRadius: "34px 34px 34px 8px", background: "#fff", border: "1px solid #e6dccd", color: INK, fontFamily: inter, fontWeight: 700, fontSize: 44, boxShadow: "0 20px 40px rgba(90,60,20,0.2)" }}>
              {msg}
              <div style={{ position: "absolute", left: -8, top: "50%", height: 8, width: `calc(${cut * 100}% + ${cut * 16}px)`, background: "#dc2626", borderRadius: 4, rotate: "-4deg" }} />
            </div>
          </div>
        );
      })}
    </>
  );
};

const Main: React.FC = () => {
  const frame = useCurrentFrame();
  const toCta = interpolate(frame, [T8.cta - 6, T8.cta + 6], [0, 1], clamp);
  const toFini = interpolate(frame, [T8.fini - 6, T8.fini + 6], [0, 1], clamp);
  const back = interpolate(frame, [T8.ready - 6, T8.ready + 8], [0, 1], clamp);
  const sheet = spring({ frame: frame - T8.sheet, fps: FPS, config: { damping: 18, stiffness: 170 } });
  const zoom = interpolate(frame, [T8.choose - 6, T8.choose + 8], [0, 1], clamp);
  const scrollY = interpolate(frame, [0, T8.products, T8.choose], [0, 120, 300], clamp);
  const stamp = usePop(T8.ready + 2, 240);
  const pricePill = usePop(T8.ready + 16, 220);
  const ctaIn = usePop(T8.cta, 160);
  const typed = "page".slice(0, Math.max(0, Math.floor((frame - T8.cta - 8) / 4)));
  const arrow = Math.sin(frame / 5) * 10;
  const phoneScale = interpolate(zoom, [0, 1], [0.5, 0.6]) * (1 - toFini * 0.45) + back * 0.2;
  const phoneY = interpolate(zoom, [0, 1], [920, 900]);
  const sway = Math.sin(frame / 18) * 3;
  return (
    <AbsoluteFill>
      <Stage />
      <div style={{ opacity: 1 - toCta }}>
        <Title from={-1} to={T8.page}>Tu vends<br />sur <Em>Insta</Em> ?</Title>
        <Title from={T8.page} to={T8.products}>Il te faut<br /><Em>cette page</Em></Title>
        <Title from={T8.products} to={T8.choose}>Tes produits,<br /><Em>avec les prix</Em></Title>
        <Title from={T8.choose} to={T8.order}>Elle <Em>choisit…</Em></Title>
        <Title from={T8.order} to={T8.fini}>…commande<br /><Em color="#128c7e">en 1 clic</Em></Title>
        <Title from={T8.fini} to={T8.ready}>Fini les<br /><Em color="#dc2626">« Prix ? »</Em></Title>
        <Title from={T8.ready} to={T8.cta}>Prête en <Em>24 h</Em></Title>

        {frame < T8.choose + 6 ? <Floating /> : null}

        <Phone style={{ ...phoneAt(phoneY, phoneScale), opacity: 1 - toFini * (1 - back), transform: `perspective(2400px) rotateY(${sway * (1 - zoom)}deg)`, translate: `0px ${toFini * (1 - back) * 200}px` }}>
          {frame < T8.chat ? (
            <>
              <Screen src="mini-full.png" y={scrollY} />
              <Tap x={100} y={250} at={T8.tapProduct} />
              {frame >= T8.sheet - 2 ? (
                <AbsoluteFill style={{ translate: `0px ${(1 - sheet) * 100}%`, opacity: interpolate(sheet, [0, 0.2], [0, 1], clamp) }}>
                  <Screen src="mini-sheet.png" />
                  <Tap x={164} y={583} at={T8.tapSize} />
                  <Tap x={195} y={798} at={T8.tapOrder} />
                </AbsoluteFill>
              ) : null}
            </>
          ) : frame < T8.ready - 6 ? (
            <Chat />
          ) : (
            <Screen src="mini-full.png" y={interpolate(frame, [T8.ready, T8.cta], [0, 420])} />
          )}
        </Phone>

        {frame >= T8.order && frame < T8.fini ? (
          <div style={{ position: "absolute", top: 1275, left: 0, right: 0, display: "flex", justifyContent: "center", scale: String(spring({ frame: frame - T8.chat, fps: FPS, config: { damping: 12, stiffness: 220 } })) }}>
            <div style={{ padding: "12px 30px", borderRadius: 999, background: WA, color: "#052e16", fontFamily: inter, fontWeight: 900, fontSize: 38, boxShadow: "0 14px 34px rgba(37,211,102,0.4)" }}>✓ Commande reçue sur WhatsApp</div>
          </div>
        ) : null}

        {frame >= T8.fini - 2 && frame < T8.ready + 4 ? <Fini /> : null}

        {frame >= T8.ready ? (
          <>
            <div style={{ position: "absolute", top: 620, left: PHONE_SAFE.left + 10, width: 230, height: 230, borderRadius: 999, border: `8px solid ${GOLD}`, background: "rgba(255,253,249,0.92)", display: "grid", placeItems: "center", rotate: "-12deg", scale: String(interpolate(stamp, [0, 1], [2.2, 1])), opacity: interpolate(stamp, [0, 0.3], [0, 1], clamp), boxShadow: "0 20px 44px rgba(90,60,20,0.25)" }}>
              <div style={{ textAlign: "center", fontFamily: serif, fontWeight: 600, fontSize: 96, lineHeight: 0.9, color: INK }}>24 h<div style={{ fontFamily: inter, fontSize: 24, fontWeight: 800, letterSpacing: 4, color: GOLD, marginTop: 8 }}>EN LIGNE</div></div>
            </div>
            <div style={{ position: "absolute", top: 1270, left: 0, right: 0, display: "flex", justifyContent: "center", scale: String(pricePill) }}>
              <div style={{ padding: "12px 34px", borderRadius: 999, background: INK, color: "#fff", fontFamily: inter, fontWeight: 800, fontSize: 40, boxShadow: "0 16px 36px rgba(29,26,22,0.35)" }}><span style={{ color: "#f3d27a", fontWeight: 900 }}>{PRICE}</span> · une seule fois</div>
            </div>
          </>
        ) : null}
      </div>

      {/* Call to action */}
      {frame >= T8.cta - 6 ? (
        <div style={{ opacity: toCta }}>
          <div style={{ position: "absolute", top: PHONE_SAFE.top + 40, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 22, scale: String(ctaIn) }}>
            <FlowMark size={104} />
            <div style={{ fontFamily: inter, fontWeight: 900, fontSize: 84, letterSpacing: -2.5, color: INK }}>Flow<span style={{ color: "#0f766e" }}>nova</span></div>
          </div>
          <div style={{ position: "absolute", top: 520, left: PHONE_SAFE.left, width: PHONE_SAFE.width, textAlign: "center", fontFamily: serif, fontWeight: 600, fontSize: 110, lineHeight: 1, color: INK }}>
            Commente<br /><Em>« page »</Em>
          </div>
          <div style={{ position: "absolute", top: 800, left: PHONE_SAFE.left + 20, width: PHONE_SAFE.width - 40, padding: "22px 26px", display: "flex", alignItems: "center", gap: 20, borderRadius: 999, background: "#fff", border: "2px solid #e6dccd", boxShadow: "0 24px 50px rgba(90,60,20,0.2)" }}>
            <div style={{ width: 66, height: 66, borderRadius: 99, background: "#fecdd3", flexShrink: 0 }} />
            <div style={{ flex: 1, fontFamily: inter, fontSize: 46, fontWeight: 800, color: typed ? INK : "#a8a29e" }}>{typed || "Ajouter un commentaire…"}</div>
            <div style={{ fontSize: 50, translate: `0px ${arrow}px` }}>👇</div>
          </div>
          <div style={{ position: "absolute", top: 990, left: PHONE_SAFE.left, width: PHONE_SAFE.width, textAlign: "center", fontFamily: inter, fontWeight: 700, fontSize: 42, color: "#5b5348", opacity: interpolate(frame, [T8.cta + 22, T8.cta + 32], [0, 1], clamp) }}>
            Je t'envoie la démo de ta mini-page
          </div>
          <div style={{ position: "absolute", top: 1090, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: interpolate(frame, [T8.cta + 30, T8.cta + 40], [0, 1], clamp) }}>
            <div style={{ padding: "12px 34px", borderRadius: 999, background: INK, color: "#fff", fontFamily: inter, fontWeight: 800, fontSize: 40 }}><span style={{ color: "#f3d27a", fontWeight: 900 }}>{PRICE}</span> · une seule fois · prête en 24 h</div>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const Episode8: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: "#f7f1e8" }}>
      <Main />
      {SUBS.map(([start, text], i) => {
        const end = i + 1 < SUBS.length ? SUBS[i + 1][0] : E8_TOTAL - LOOP_FADE;
        return (
          <Sequence key={start} from={start} durationInFrames={end - start} layout="none">
            <Sub text={text} delay={i === 0 ? -30 : 0} />
          </Sequence>
        );
      })}
      <Sequence from={E8_TOTAL - LOOP_FADE} durationInFrames={LOOP_FADE}>
        <AbsoluteFill style={{ opacity: interpolate(frame, [E8_TOTAL - LOOP_FADE, E8_TOTAL - 2], [0, 1], clamp) }}>
          <Main />
          <Sub text={SUBS[0][1]} delay={-30} />
        </AbsoluteFill>
      </Sequence>
      <Audio src={staticFile("audio/episode8_full.wav")} />
    </AbsoluteFill>
  );
};

export const Episode8Composition: React.FC = () => (
  <Composition id="Episode8" component={Episode8} durationInFrames={E8_TOTAL} fps={FPS} width={1080} height={1920} />
);
