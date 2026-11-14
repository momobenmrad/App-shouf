import { Audio } from "@remotion/media";
import React from "react";
import {
  AbsoluteFill,
  Composition,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from "remotion";
import { Backdrop, Caption, Chip, ease, Phone, Screen, Tap, useEnter } from "../components";
import { ORDERS } from "../premium/timeline";
import { dt, Notification, Stamp } from "../premium/Scenes";
import { C, css, FPS, inter, PHONE_W } from "../theme";
import {
  HOOK_CLOSE,
  HOOK_PUNCH,
  ORDER_HITS,
  ORDERS_WORDS,
  PROOF_CART_TAP,
  PROOF_COD,
  PROOF_COD_TAP,
  REVEAL_FLASH,
  REVEAL_OPEN,
  REVEAL_SAME,
  V,
  V_TOTAL,
} from "./timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Before/after split inside the phone: "before" on the left, `p` = % of the "after" uncovered from the right. */
const Split: React.FC<{ p: number; knob: boolean }> = ({ p, knob }) => {
  const x = css(390) * (1 - p / 100);
  return (
    <>
      <Screen src="before.png" />
      <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 0 0 ${100 - p}%)` }}>
        <Screen src="home-top.png" />
      </div>
      {knob && p > 0 && p < 100 ? (
        <>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: x - 3, width: 6, background: "#fff", boxShadow: "0 0 24px rgba(0,0,0,0.5)" }} />
          <div
            style={{
              position: "absolute",
              top: css(844) / 2 - 42,
              left: x - 42,
              width: 84,
              height: 84,
              borderRadius: 42,
              background: "#fff",
              boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
              display: "grid",
              placeItems: "center",
              fontFamily: inter,
              fontWeight: 900,
              fontSize: 34,
              color: C.brandDeep,
            }}
          >
            ‹ ›
          </div>
        </>
      ) : null}
    </>
  );
};

const SplitLabels: React.FC<{ opacity: number }> = ({ opacity }) => (
  <div
    style={{
      position: "absolute",
      top: 548,
      left: 200,
      right: 200,
      display: "flex",
      justifyContent: "space-between",
      fontFamily: inter,
      fontWeight: 900,
      fontSize: 46,
      opacity,
    }}
  >
    <span style={{ color: "#f87171" }}>AVANT</span>
    <span style={{ color: C.brand }}>APRÈS</span>
  </div>
);

/**
 * The opening frame, fully composed (no animation needed to read it): hook text, split phone,
 * AVANT / APRÈS labels. Also used at the very end so the loop restarts invisibly.
 */
const HeroFrame: React.FC = () => (
  <AbsoluteFill>
    <Caption text="Si ta boutique ressemble à *ÇA…*" top={200} size={92} delay={-60} />
    <SplitLabels opacity={1} />
    <Phone>
      <Split p={50} knob />
    </Phone>
  </AbsoluteFill>
);

/** 0–3.4 s — "Si ta boutique en ligne ressemble à ça… tu perds des clients." */
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [...HOOK_CLOSE], [50, 0], { ...clamp, easing: ease });
  const shake = frame >= HOOK_PUNCH && frame < HOOK_PUNCH + 12 ? Math.sin(frame * 2.4) * interpolate(frame, [HOOK_PUNCH, HOOK_PUNCH + 12], [14, 0]) : 0;
  return (
    <AbsoluteFill>
      {frame < HOOK_PUNCH ? (
        <Caption text="Si ta boutique ressemble à *ÇA…*" top={200} size={92} delay={-60} />
      ) : (
        <Caption text="…tu perds des *clients* 😬" top={210} size={100} delay={HOOK_PUNCH} />
      )}
      <SplitLabels opacity={interpolate(frame, [HOOK_CLOSE[0], HOOK_CLOSE[1]], [1, 0], clamp)} />
      <Phone style={{ translate: `${shake}px 0px`, rotate: `${shake * 0.15}deg` }}>
        <Split p={p} knob />
      </Phone>
      {frame >= HOOK_CLOSE[1] + 2 ? <Stamp label="AVANT" at={HOOK_CLOSE[1] + 2} style={{ top: 950, left: 300 }} /> : null}
    </AbsoluteFill>
  );
};

/** 3.4–6 s — "Regarde. Même boutique… version premium." */
const Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [...REVEAL_OPEN], [0, 100], { ...clamp, easing: ease });
  return (
    <AbsoluteFill>
      {frame < REVEAL_SAME ? (
        <Caption text="Regarde 👀" top={230} size={110} />
      ) : (
        <Caption text="Même boutique… version *premium*" top={210} size={96} delay={REVEAL_SAME} />
      )}
      <SplitLabels opacity={frame < REVEAL_FLASH ? interpolate(frame, [0, 6], [0, 1], clamp) : 0} />
      <Phone style={{ scale: interpolate(frame, [REVEAL_FLASH, 77], [1.05, 1], clamp) }}>
        <Split p={p} knob={frame < REVEAL_FLASH} />
      </Phone>
      <AbsoluteFill
        style={{
          background: "#fff",
          opacity: interpolate(frame, [REVEAL_FLASH - 1, REVEAL_FLASH, REVEAL_FLASH + 8], [0, 0.85, 0], clamp),
        }}
      />
    </AbsoluteFill>
  );
};

/** 6–8.2 s — "Panier en un clic, paiement à la livraison." */
const Proofs: React.FC = () => {
  const frame = useCurrentFrame();
  const cod = frame >= PROOF_COD;
  return (
    <AbsoluteFill>
      {cod ? (
        <Caption key="cod" text="Paiement à la *livraison*" top={220} size={100} delay={PROOF_COD} />
      ) : (
        <Caption key="cart" text="Panier en *1_clic*" top={220} size={110} />
      )}
      <Phone>
        {!cod ? (
          <>
            <Screen src="product-1.png" />
            <Screen src="product-2.png" style={{ opacity: frame >= PROOF_CART_TAP + 2 ? 1 : 0 }} />
            <Tap x={270} y={611} at={PROOF_CART_TAP} />
          </>
        ) : (
          <>
            <Screen src="checkout-full.png" y={1580} />
            <Tap x={195} y={676} at={PROOF_COD_TAP} />
            <Screen src="success.png" style={{ opacity: frame >= PROOF_COD_TAP + 3 ? 1 : 0 }} />
          </>
        )}
      </Phone>
    </AbsoluteFill>
  );
};

/** 8.2–10.4 s — "Et le soir… les commandes tombent !" */
const Orders: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const arrived = ORDER_HITS.filter((f) => frame >= f).length;
  const total = ORDERS.slice(0, arrived).reduce((s, o) => s + o.amount, 0);
  const lastAt = arrived ? ORDER_HITS[arrived - 1] : 0;
  const bump = arrived ? spring({ frame: frame - lastAt, fps, config: { damping: 10, stiffness: 300 } }) : 1;
  const buzz = arrived && frame - lastAt < 6 ? Math.sin(frame * 3) * 4 : 0;
  return (
    <AbsoluteFill>
      {frame < ORDERS_WORDS ? (
        <Caption text="Et le soir… 🌙" top={220} size={110} />
      ) : (
        <Caption text="Les commandes *tombent* 🔥" top={210} size={96} delay={ORDERS_WORDS} />
      )}
      <div
        style={{
          position: "absolute",
          top: 430,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: inter,
          fontWeight: 900,
          fontSize: 76,
          color: C.yellow,
          opacity: arrived ? 1 : 0,
          scale: interpolate(bump, [0, 1], [1.25, 1]),
        }}
      >
        + {dt(total)}
      </div>
      <div style={{ position: "absolute", top: 530, left: 0, right: 0, textAlign: "center", fontFamily: inter, fontWeight: 600, fontSize: 28, color: C.muted, opacity: arrived ? 0.8 : 0 }}>
        Démo — commandes simulées
      </div>
      <Phone style={{ translate: `${buzz}px 0px` }}>
        <AbsoluteFill style={{ background: `radial-gradient(120% 80% at 30% 0%, ${C.brand}, ${C.brandDeep} 45%, #04211d)` }} />
        <div style={{ position: "absolute", top: 120, left: 0, right: 0, textAlign: "center", color: "#fff", fontFamily: inter }}>
          <div style={{ fontSize: 30, fontWeight: 600, opacity: 0.9 }}>samedi 25 octobre</div>
          <div style={{ fontSize: 150, fontWeight: 700, letterSpacing: -4, lineHeight: 1.05 }}>21:47</div>
        </div>
        <div style={{ position: "absolute", top: 400, left: 22, width: PHONE_W - 44, display: "flex", flexDirection: "column", gap: 14 }}>
          {ORDERS.slice(0, arrived)
            .map((o, i) => ({ ...o, i }))
            .reverse()
            .slice(0, 6)
            .map((o, k) => {
              const t = frame - ORDER_HITS[o.i];
              return (
                <div
                  key={o.i}
                  style={{
                    translate: `0px ${k === 0 ? interpolate(t, [0, 5], [-120, 0], { ...clamp, easing: ease }) : 0}px`,
                    opacity: k === 0 ? interpolate(t, [0, 3], [0.2, 1], clamp) : interpolate(k, [3, 5], [1, 0.35], clamp),
                  }}
                >
                  <Notification city={o.city} amount={o.amount} index={o.i} />
                </div>
              );
            })}
        </div>
      </Phone>
    </AbsoluteFill>
  );
};

/** 10.4–14 s — "Commente SITE : je fais l'avant-après de TA boutique, gratuitement." */
const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = useEnter(4);
  const pulse = 1 + 0.035 * Math.sin((frame / 15) * Math.PI);
  return (
    <AbsoluteFill>
      <Caption text="Ton avant / après *offert*" top={210} size={96} />
      <div
        style={{
          position: "absolute",
          top: 480,
          left: 90,
          right: 90,
          padding: "52px 40px",
          borderRadius: 48,
          background: "#fff",
          textAlign: "center",
          fontFamily: inter,
          color: "#0b1f1c",
          boxShadow: "0 40px 100px rgba(0,0,0,0.45)",
          scale: interpolate(enter, [0, 1], [0.6, 1]) * pulse,
          opacity: interpolate(enter, [0, 0.3], [0, 1], clamp),
        }}
      >
        <div style={{ fontSize: 100, fontWeight: 900, letterSpacing: -2 }}>Commente</div>
        <div style={{ display: "inline-block", marginTop: 14, padding: "8px 44px", borderRadius: 24, background: C.brand, color: "#04211d", fontSize: 120, fontWeight: 900, rotate: "-2deg" }}>
          SITE
        </div>
        <div style={{ fontSize: 46, fontWeight: 700, marginTop: 26, lineHeight: 1.25 }}>
          je fais l’avant / après
          <br />
          de <span style={{ color: C.brandDeep, fontWeight: 900 }}>TA</span> boutique gratuitement
        </div>
        <div style={{ fontSize: 80, marginTop: 10, translate: `0px ${8 * Math.sin(frame / 4)}px` }}>👇</div>
      </div>
      <div style={{ position: "absolute", top: 1320, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 16 }}>
        <Chip label="0 abonnement" at={24} size={38} />
        <Chip label="Livrée clé en main" at={32} size={38} />
      </div>
    </AbsoluteFill>
  );
};

/** 14–15 s — dissolve back into the opening frame for a seamless loop. */
const Loop: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: interpolate(frame, [0, 14], [0, 1], { ...clamp, easing: ease }) }}>
      <Backdrop />
      <HeroFrame />
    </AbsoluteFill>
  );
};

export const BoutiquePremium15: React.FC = () => (
  <AbsoluteFill>
    <Backdrop />
    {/* Voice-over (ElevenLabs) + beat + sound effects, mixed by audio/make_audio_premium15.py. */}
    <Audio src={staticFile("audio/premium15_full.wav")} />
    <Sequence name="Accroche" from={V.hook.from} durationInFrames={V.hook.duration}>
      <Hook />
    </Sequence>
    <Sequence name="Révélation" from={V.reveal.from} durationInFrames={V.reveal.duration}>
      <Reveal />
    </Sequence>
    <Sequence name="Preuves" from={V.proofs.from} durationInFrames={V.proofs.duration}>
      <Proofs />
    </Sequence>
    <Sequence name="Commandes" from={V.orders.from} durationInFrames={V.orders.duration}>
      <Orders />
    </Sequence>
    <Sequence name="Appel à l'action" from={V.cta.from} durationInFrames={V.cta.duration}>
      <Cta />
    </Sequence>
    <Sequence name="Boucle" from={V.loop.from} durationInFrames={V.loop.duration}>
      <Loop />
    </Sequence>
  </AbsoluteFill>
);

export const Premium15Composition = () => (
  <Composition id="BoutiquePremium15" component={BoutiquePremium15} durationInFrames={V_TOTAL} fps={FPS} width={1080} height={1920} />
);
